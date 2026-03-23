/**
 * Arbitrage API endpoints (standalone, non-RTK Query version)
 */

import { apiPost } from '../api'
import type {
  DetectArbitrageRequest,
  ArbitrageDetectionResult,
  CorrectArbitrageRequest,
  CorrectionResponse,
  DualCertificateRequest,
  DualCertificate,
} from '@/types'

/**
 * Detect arbitrage violations
 */
export async function detectArbitrage(
  request: DetectArbitrageRequest
): Promise<ArbitrageDetectionResult> {
  return apiPost<ArbitrageDetectionResult>('/arbitrage/detect', request)
}

/**
 * Apply QP correction
 */
export async function correctArbitrage(
  request: CorrectArbitrageRequest
): Promise<CorrectionResponse> {
  return apiPost<CorrectionResponse>('/arbitrage/correct', request)
}

/**
 * Generate dual certificate
 */
export async function generateCertificate(
  request: DualCertificateRequest
): Promise<DualCertificate> {
  return apiPost<DualCertificate>('/certificate', request)
}

/**
 * Full workflow: detect, correct, verify
 */
export async function runFullAnalysis(surfaceId: string): Promise<{
  detection: ArbitrageDetectionResult
  correction: CorrectionResponse
  certificate: DualCertificate
}> {
  // Step 1: Detect
  const detection = await detectArbitrage({ surfaceId })
  
  // If no violations, return early
  if (detection.isArbitrageFree) {
    return {
      detection,
      correction: null as unknown as CorrectionResponse,
      certificate: null as unknown as DualCertificate,
    }
  }
  
  // Step 2: Correct
  const correction = await correctArbitrage({ surfaceId })
  
  // Step 3: Verify
  const certificate = await generateCertificate({
    surfaceId: correction.correctedSurfaceId,
    correctionResult: correction.correction,
  })
  
  return { detection, correction, certificate }
}
