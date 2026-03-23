/**
 * Arbitrage detection and correction type definitions
 */

import type { 
  ArbitrageViolation, 
  ArbitrageDetectionResult, 
  CorrectionResult,
  DualCertificate 
} from './api.types'

// ============================================================================
// Arbitrage State Types
// ============================================================================

/**
 * Arbitrage detection status
 */
export type DetectionStatus = 'idle' | 'detecting' | 'complete' | 'error'

/**
 * Correction status
 */
export type CorrectionStatus = 'idle' | 'correcting' | 'verifying' | 'complete' | 'error'

/**
 * Violation display configuration
 */
export interface ViolationDisplayConfig {
  showButterfly: boolean
  showCalendar: boolean
  minSeverity: 'low' | 'medium' | 'high' | 'critical'
  sortBy: 'severity' | 'strike' | 'expiry' | 'value'
  sortOrder: 'asc' | 'desc'
}

/**
 * Default violation display configuration
 */
export const DEFAULT_VIOLATION_CONFIG: ViolationDisplayConfig = {
  showButterfly: true,
  showCalendar: true,
  minSeverity: 'low',
  sortBy: 'severity',
  sortOrder: 'desc',
}

// ============================================================================
// Arbitrage Analysis State
// ============================================================================

/**
 * Complete arbitrage state
 */
export interface ArbitrageState {
  // Detection
  detectionResult: ArbitrageDetectionResult | null
  detectionStatus: DetectionStatus
  detectionError: string | null
  
  // Correction
  correctionResult: CorrectionResult | null
  correctionStatus: CorrectionStatus
  correctionError: string | null
  
  // Verification
  dualCertificate: DualCertificate | null
  isVerified: boolean
  
  // Configuration
  displayConfig: ViolationDisplayConfig
  
  // Selection
  selectedViolation: ArbitrageViolation | null
}

// ============================================================================
// Violation Filtering & Sorting
// ============================================================================

/**
 * Filtered violations result
 */
export interface FilteredViolations {
  violations: ArbitrageViolation[]
  totalCount: number
  filteredCount: number
  byType: {
    butterfly: number
    calendar: number
  }
  bySeverity: {
    low: number
    medium: number
    high: number
    critical: number
  }
}

/**
 * Violation statistics
 */
export interface ViolationStats {
  total: number
  butterfly: number
  calendar: number
  avgSeverity: number
  maxValue: number
  affectedStrikes: number[]
  affectedExpiries: number[]
}

// ============================================================================
// Correction Progress
// ============================================================================

/**
 * QP solver progress update
 */
export interface CorrectionProgress {
  iteration: number
  maxIterations: number
  currentObjective: number
  feasibilityGap: number
  status: 'initializing' | 'solving' | 'verifying' | 'complete'
}

/**
 * Correction comparison metrics
 */
export interface CorrectionMetrics {
  originalViolations: number
  remainingViolations: number
  correctionCost: number  // L2 norm
  maxAdjustment: number
  avgAdjustment: number
  computeTime: number  // milliseconds
}
