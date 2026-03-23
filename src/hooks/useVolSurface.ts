import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  setCurrentSurface,
  setCorrectedSurface,
  clearSurfaces,
  setSelectedCell,
  updateDisplayConfig,
  setLoading,
  setError,
} from '@/store/slices/surfaceSlice'
import { useCreateSurfaceMutation } from '@/store/api/volArbApi'
import type { CreateSurfaceRequest, SurfaceData, SurfaceCell, SurfaceDisplayConfig } from '@/types'

/**
 * Hook for managing volatility surface state and operations
 */
export function useVolSurface() {
  const dispatch = useAppDispatch()
  
  // Select state
  const currentSurface = useAppSelector((state) => state.surface.currentSurface)
  const correctedSurface = useAppSelector((state) => state.surface.correctedSurface)
  const selectedCell = useAppSelector((state) => state.surface.selectedCell)
  const displayConfig = useAppSelector((state) => state.surface.displayConfig)
  const loading = useAppSelector((state) => state.surface.loading)
  const error = useAppSelector((state) => state.surface.error)
  const surfaceHistory = useAppSelector((state) => state.surface.surfaceHistory)
  
  // RTK Query mutation
  const [createSurface, createSurfaceResult] = useCreateSurfaceMutation()

  /**
   * Build a new surface from quotes
   */
  const buildSurface = useCallback(
    async (request: CreateSurfaceRequest) => {
      dispatch(setLoading({ isLoading: true, isBuilding: true, message: 'Building surface...' }))
      
      try {
        const result = await createSurface(request).unwrap()
        dispatch(setCurrentSurface(result))
        dispatch(setLoading({ isLoading: false, isBuilding: false }))
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to build surface'
        dispatch(setError({ message: errorMessage }))
        dispatch(setLoading({ isLoading: false, isBuilding: false }))
        throw err
      }
    },
    [dispatch, createSurface]
  )

  /**
   * Set current surface directly
   */
  const setSurface = useCallback(
    (surface: SurfaceData | null) => {
      dispatch(setCurrentSurface(surface))
    },
    [dispatch]
  )

  /**
   * Set corrected surface
   */
  const setCorrected = useCallback(
    (surface: SurfaceData | null) => {
      dispatch(setCorrectedSurface(surface))
    },
    [dispatch]
  )

  /**
   * Clear all surfaces
   */
  const clear = useCallback(() => {
    dispatch(clearSurfaces())
  }, [dispatch])

  /**
   * Select a cell on the surface
   */
  const selectCell = useCallback(
    (cell: SurfaceCell | null) => {
      dispatch(setSelectedCell(cell))
    },
    [dispatch]
  )

  /**
   * Update display configuration
   */
  const updateConfig = useCallback(
    (config: Partial<SurfaceDisplayConfig>) => {
      dispatch(updateDisplayConfig(config))
    },
    [dispatch]
  )

  /**
   * Get IV value at specific strike and expiry
   */
  const getIVAt = useCallback(
    (strike: number, expiry: number): number | null => {
      if (!currentSurface) return null
      
      const strikeIdx = currentSurface.strikes.indexOf(strike)
      const expiryIdx = currentSurface.expiries.indexOf(expiry)
      
      if (strikeIdx === -1 || expiryIdx === -1) return null
      
      return currentSurface.ivGrid[expiryIdx]?.[strikeIdx] ?? null
    },
    [currentSurface]
  )

  /**
   * Get volatility smile for a fixed expiry
   */
  const getSmile = useCallback(
    (expiry: number): Array<{ strike: number; iv: number }> | null => {
      if (!currentSurface) return null
      
      const expiryIdx = currentSurface.expiries.indexOf(expiry)
      if (expiryIdx === -1) return null
      
      return currentSurface.strikes.map((strike, i) => ({
        strike,
        iv: currentSurface.ivGrid[expiryIdx][i],
      }))
    },
    [currentSurface]
  )

  /**
   * Get term structure for a fixed strike
   */
  const getTermStructure = useCallback(
    (strike: number): Array<{ expiry: number; iv: number }> | null => {
      if (!currentSurface) return null
      
      const strikeIdx = currentSurface.strikes.indexOf(strike)
      if (strikeIdx === -1) return null
      
      return currentSurface.expiries.map((expiry, i) => ({
        expiry,
        iv: currentSurface.ivGrid[i][strikeIdx],
      }))
    },
    [currentSurface]
  )

  /**
   * Check if we have a surface
   */
  const hasSurface = useMemo(
    () => currentSurface !== null,
    [currentSurface]
  )

  /**
   * Check if we have a corrected surface
   */
  const hasCorrectedSurface = useMemo(
    () => correctedSurface !== null,
    [correctedSurface]
  )

  return {
    // State
    currentSurface,
    correctedSurface,
    selectedCell,
    displayConfig,
    loading,
    error,
    surfaceHistory,
    
    // Computed
    hasSurface,
    hasCorrectedSurface,
    
    // Actions
    buildSurface,
    setSurface,
    setCorrected,
    clear,
    selectCell,
    updateConfig,
    
    // Helpers
    getIVAt,
    getSmile,
    getTermStructure,
    
    // RTK Query state
    isBuilding: createSurfaceResult.isLoading,
    buildError: createSurfaceResult.error,
  }
}
