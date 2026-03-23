import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  setDetectionStatus,
  setDetectionResult,
  setDetectionError,
  setSelectedViolation,
  updateDisplayConfig as updateArbitrageDisplayConfig,
  resetArbitrageState,
} from '@/store/slices/arbitrageSlice'
import { useDetectArbitrageMutation } from '@/store/api/volArbApi'
import type {
  ArbitrageViolation,
  ViolationDisplayConfig,
  FilteredViolations,
  DetectArbitrageRequest,
} from '@/types'

/**
 * Hook for managing arbitrage detection state and operations
 */
export function useArbitrageDetection() {
  const dispatch = useAppDispatch()
  
  // Select state
  const detectionResult = useAppSelector((state) => state.arbitrage.detectionResult)
  const detectionStatus = useAppSelector((state) => state.arbitrage.detectionStatus)
  const detectionError = useAppSelector((state) => state.arbitrage.detectionError)
  const displayConfig = useAppSelector((state) => state.arbitrage.displayConfig)
  const selectedViolation = useAppSelector((state) => state.arbitrage.selectedViolation)
  
  // RTK Query mutation
  const [detectArbitrage, detectResult] = useDetectArbitrageMutation()

  /**
   * Run arbitrage detection on a surface
   */
  const detect = useCallback(
    async (request: DetectArbitrageRequest) => {
      dispatch(setDetectionStatus('detecting'))
      
      try {
        const result = await detectArbitrage(request).unwrap()
        dispatch(setDetectionResult(result))
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Detection failed'
        dispatch(setDetectionError(errorMessage))
        throw err
      }
    },
    [dispatch, detectArbitrage]
  )

  /**
   * Select a violation
   */
  const selectViolation = useCallback(
    (violation: ArbitrageViolation | null) => {
      dispatch(setSelectedViolation(violation))
    },
    [dispatch]
  )

  /**
   * Update display configuration
   */
  const updateConfig = useCallback(
    (config: Partial<ViolationDisplayConfig>) => {
      dispatch(updateArbitrageDisplayConfig(config))
    },
    [dispatch]
  )

  /**
   * Reset detection state
   */
  const reset = useCallback(() => {
    dispatch(resetArbitrageState())
  }, [dispatch])

  /**
   * Get filtered and sorted violations
   */
  const filteredViolations = useMemo((): FilteredViolations | null => {
    if (!detectionResult) return null

    let violations = [...detectionResult.violations]
    
    // Filter by type
    if (!displayConfig.showButterfly) {
      violations = violations.filter((v) => v.type !== 'butterfly')
    }
    if (!displayConfig.showCalendar) {
      violations = violations.filter((v) => v.type !== 'calendar')
    }
    
    // Filter by severity
    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 }
    const minSeverityValue = severityOrder[displayConfig.minSeverity]
    violations = violations.filter((v) => severityOrder[v.severity] >= minSeverityValue)
    
    // Sort
    violations.sort((a, b) => {
      let comparison = 0
      
      switch (displayConfig.sortBy) {
        case 'severity':
          comparison = severityOrder[b.severity] - severityOrder[a.severity]
          break
        case 'strike':
          comparison = a.strike - b.strike
          break
        case 'expiry':
          comparison = a.expiry - b.expiry
          break
        case 'value':
          comparison = Math.abs(b.value) - Math.abs(a.value)
          break
      }
      
      return displayConfig.sortOrder === 'desc' ? comparison : -comparison
    })

    // Count by type and severity
    const byType = {
      butterfly: detectionResult.violations.filter((v) => v.type === 'butterfly').length,
      calendar: detectionResult.violations.filter((v) => v.type === 'calendar').length,
    }
    
    const bySeverity = {
      low: detectionResult.violations.filter((v) => v.severity === 'low').length,
      medium: detectionResult.violations.filter((v) => v.severity === 'medium').length,
      high: detectionResult.violations.filter((v) => v.severity === 'high').length,
      critical: detectionResult.violations.filter((v) => v.severity === 'critical').length,
    }

    return {
      violations,
      totalCount: detectionResult.violations.length,
      filteredCount: violations.length,
      byType,
      bySeverity,
    }
  }, [detectionResult, displayConfig])

  /**
   * Check if surface is arbitrage-free
   */
  const isArbitrageFree = useMemo(
    () => detectionResult?.isArbitrageFree ?? null,
    [detectionResult]
  )

  /**
   * Get total violation count
   */
  const violationCount = useMemo(
    () => detectionResult?.violations.length ?? 0,
    [detectionResult]
  )

  return {
    // State
    detectionResult,
    detectionStatus,
    detectionError,
    displayConfig,
    selectedViolation,
    
    // Computed
    filteredViolations,
    isArbitrageFree,
    violationCount,
    
    // Actions
    detect,
    selectViolation,
    updateConfig,
    reset,
    
    // RTK Query state
    isDetecting: detectResult.isLoading,
  }
}
