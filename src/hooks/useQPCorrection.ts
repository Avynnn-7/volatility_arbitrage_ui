import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  setCorrectionStatus,
  setCorrectionResult,
  setCorrectionError,
  setDualCertificate,
} from '@/store/slices/arbitrageSlice'
import { setCorrectedSurface } from '@/store/slices/surfaceSlice'
import {
  useCorrectArbitrageMutation,
  useGenerateCertificateMutation,
} from '@/store/api/volArbApi'
import type { CorrectArbitrageRequest, DualCertificateRequest, CorrectionMetrics } from '@/types'

/**
 * Hook for managing QP correction state and operations
 */
export function useQPCorrection() {
  const dispatch = useAppDispatch()
  
  // Select state
  const correctionResult = useAppSelector((state) => state.arbitrage.correctionResult)
  const correctionStatus = useAppSelector((state) => state.arbitrage.correctionStatus)
  const correctionError = useAppSelector((state) => state.arbitrage.correctionError)
  const dualCertificate = useAppSelector((state) => state.arbitrage.dualCertificate)
  const isVerified = useAppSelector((state) => state.arbitrage.isVerified)
  const correctedSurface = useAppSelector((state) => state.surface.correctedSurface)
  
  // RTK Query mutations
  const [correctArbitrage, correctResult] = useCorrectArbitrageMutation()
  const [generateCertificate, certificateResult] = useGenerateCertificateMutation()

  /**
   * Run QP correction
   */
  const correct = useCallback(
    async (request: CorrectArbitrageRequest) => {
      dispatch(setCorrectionStatus('correcting'))
      
      try {
        const result = await correctArbitrage(request).unwrap()
        dispatch(setCorrectionResult(result.correction))
        dispatch(setCorrectedSurface(result.correctedSurface))
        dispatch(setCorrectionStatus('complete'))
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Correction failed'
        dispatch(setCorrectionError(errorMessage))
        throw err
      }
    },
    [dispatch, correctArbitrage]
  )

  /**
   * Verify correction with dual certificate
   */
  const verify = useCallback(
    async (request: DualCertificateRequest) => {
      dispatch(setCorrectionStatus('verifying'))
      
      try {
        const certificate = await generateCertificate(request).unwrap()
        dispatch(setDualCertificate(certificate))
        dispatch(setCorrectionStatus('complete'))
        return certificate
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Verification failed'
        dispatch(setCorrectionError(errorMessage))
        throw err
      }
    },
    [dispatch, generateCertificate]
  )

  /**
   * Run correction and verification in sequence
   */
  const correctAndVerify = useCallback(
    async (surfaceId: string) => {
      const correctionResponse = await correct({ surfaceId })
      const certificate = await verify({
        surfaceId: correctionResponse.correctedSurfaceId,
        correctionResult: correctionResponse.correction,
      })
      return { correctionResponse, certificate }
    },
    [correct, verify]
  )

  /**
   * Get correction metrics
   */
  const metrics = useMemo((): CorrectionMetrics | null => {
    if (!correctionResult) return null
    
    return {
      originalViolations: 0,  // Would come from detection result
      remainingViolations: 0,
      correctionCost: correctionResult.objectiveValue,
      maxAdjustment: correctionResult.maxCorrection,
      avgAdjustment: correctionResult.avgCorrection,
      computeTime: 0,  // Would come from timing
    }
  }, [correctionResult])

  /**
   * Check if correction was successful
   */
  const isSuccessful = useMemo(
    () => correctionResult?.status === 'optimal',
    [correctionResult]
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
    correctionResult,
    correctionStatus,
    correctionError,
    dualCertificate,
    isVerified,
    correctedSurface,
    
    // Computed
    metrics,
    isSuccessful,
    hasCorrectedSurface,
    
    // Actions
    correct,
    verify,
    correctAndVerify,
    
    // RTK Query state
    isCorrecting: correctResult.isLoading,
    isVerifying: certificateResult.isLoading,
  }
}
