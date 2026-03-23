/**
 * useLocalVolatility Hook
 * 
 * Provides local volatility calculation from implied volatility surface data.
 * Uses Dupire's formula for calculation.
 */

import { useMemo, useCallback, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import type { RootState } from '@/store/store'
import {
  buildLocalVolSurface,
  calculateLocalVolStats,
  interpolateLocalVol,
  surfaceDataToPoints,
  type LocalVolSurfaceData,
} from '@/utils/localVolatility'

// ============================================================================
// Selectors
// ============================================================================

/**
 * Select the current surface data from Redux store
 */
const selectSurfaceData = (state: RootState) => state.surface.currentSurface

/**
 * Select the spot price from current surface market data
 */
const selectSpotPrice = (state: RootState) => state.surface.currentSurface?.marketData?.spot ?? null

/**
 * Select corrected surface if available
 */
const selectCorrectedSurface = (state: RootState) => state.surface.correctedSurface

// ============================================================================
// Hook Options & Return Types
// ============================================================================

interface UseLocalVolatilityOptions {
  riskFreeRate?: number
  dividendYield?: number
  useCorrectedSurface?: boolean
}

interface UseLocalVolatilityReturn {
  localVolSurface: LocalVolSurfaceData | null
  isCalculating: boolean
  error: string | null
  stats: ReturnType<typeof calculateLocalVolStats> | null
  interpolate: (strike: number, maturity: number) => number | null
  recalculate: (options?: UseLocalVolatilityOptions) => void
}

// ============================================================================
// Main Hook
// ============================================================================

export function useLocalVolatility(
  options: UseLocalVolatilityOptions = {}
): UseLocalVolatilityReturn {
  const { 
    riskFreeRate = 0.05, 
    dividendYield = 0.02,
    useCorrectedSurface = false 
  } = options
  
  const surfaceData = useAppSelector(useCorrectedSurface ? selectCorrectedSurface : selectSurfaceData)
  const spotPrice = useAppSelector(selectSpotPrice)
  
  const [customOptions, setCustomOptions] = useState<UseLocalVolatilityOptions>({})
  
  const effectiveRate = customOptions.riskFreeRate ?? riskFreeRate
  const effectiveYield = customOptions.dividendYield ?? dividendYield
  
  const { localVolSurface, error } = useMemo(() => {
    if (!surfaceData || !spotPrice) {
      return { localVolSurface: null, error: null }
    }
    
    try {
      // Convert SurfaceData to VolatilitySurfacePoint array
      const points = surfaceDataToPoints(
        surfaceData.strikes,
        surfaceData.expiries,
        surfaceData.ivGrid
      )
      
      if (points.length === 0) {
        return { localVolSurface: null, error: null }
      }
      
      const surface = buildLocalVolSurface(
        points,
        spotPrice,
        effectiveRate,
        effectiveYield
      )
      
      return { localVolSurface: surface, error: null }
    } catch (err) {
      return { 
        localVolSurface: null, 
        error: err instanceof Error ? err.message : 'Failed to calculate local volatility' 
      }
    }
  }, [surfaceData, spotPrice, effectiveRate, effectiveYield])
  
  const isCalculating = false // Synchronous operation is instantaneous
  
  const stats = useMemo(() => {
    if (!localVolSurface) return null
    return calculateLocalVolStats(localVolSurface)
  }, [localVolSurface])
  
  const interpolate = useCallback((strike: number, maturity: number): number | null => {
    if (!localVolSurface) return null
    return interpolateLocalVol(localVolSurface, strike, maturity)
  }, [localVolSurface])
  
  const recalculate = useCallback((newOptions?: UseLocalVolatilityOptions) => {
    if (newOptions) {
      setCustomOptions(prev => ({ ...prev, ...newOptions }))
    }
  }, [])
  
  return {
    localVolSurface,
    isCalculating,
    error,
    stats,
    interpolate,
    recalculate
  }
}

// ============================================================================
// Comparison Hook
// ============================================================================

/**
 * Hook for comparing implied and local volatility at specific points
 */
export function useVolatilityComparison() {
  const { localVolSurface, stats: localStats } = useLocalVolatility()
  const surfaceData = useAppSelector(selectSurfaceData)
  
  const comparison = useMemo(() => {
    if (!localVolSurface || !surfaceData) return null
    
    const points = localVolSurface.points.map(point => ({
      strike: point.strike,
      maturity: point.maturity,
      impliedVol: point.impliedVol,
      localVol: point.localVol,
      difference: point.localVol - point.impliedVol,
      percentDiff: ((point.localVol - point.impliedVol) / point.impliedVol) * 100,
      isValid: point.isValid
    }))
    
    // Calculate aggregate comparison stats
    const validPoints = points.filter(p => p.isValid)
    
    if (validPoints.length === 0) {
      return {
        points,
        avgImplied: 0,
        avgLocal: 0,
        avgDiff: 0,
        maxDiff: 0,
        correlation: 0
      }
    }
    
    const avgImplied = validPoints.reduce((s, p) => s + p.impliedVol, 0) / validPoints.length
    const avgLocal = validPoints.reduce((s, p) => s + p.localVol, 0) / validPoints.length
    const avgDiff = validPoints.reduce((s, p) => s + p.difference, 0) / validPoints.length
    const maxDiff = Math.max(...validPoints.map(p => Math.abs(p.difference)))
    
    return {
      points,
      avgImplied,
      avgLocal,
      avgDiff,
      maxDiff,
      correlation: calculateCorrelation(
        validPoints.map(p => p.impliedVol),
        validPoints.map(p => p.localVol)
      )
    }
  }, [localVolSurface, surfaceData])
  
  return { comparison, localStats }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n === 0) return 0
  
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n
  
  let numerator = 0
  let denomX = 0
  let denomY = 0
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    numerator += dx * dy
    denomX += dx * dx
    denomY += dy * dy
  }
  
  const denom = Math.sqrt(denomX * denomY)
  return denom > 0 ? numerator / denom : 0
}
