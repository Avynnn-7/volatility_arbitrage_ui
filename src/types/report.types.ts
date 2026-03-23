/**
 * Report generation type definitions
 * Used for PDF report generation with @react-pdf/renderer
 */

import type { ArbitrageViolation } from './api.types'

// ============================================================================
// Report Metadata
// ============================================================================

/**
 * Report metadata - identification and context
 */
export interface ReportMetadata {
  /** Unique report identifier */
  reportId: string
  /** ISO timestamp of generation */
  generatedAt: string
  /** Underlying symbol (e.g., SPX, AAPL) */
  underlying: string
  /** Spot price at time of analysis */
  spotPrice: number
  /** Data date (ISO date string) */
  dataDate: string
  /** Report version */
  version: string
}

// ============================================================================
// Analysis Summary
// ============================================================================

/**
 * High-level analysis summary metrics
 */
export interface AnalysisSummary {
  /** ATM implied volatility */
  atmImpliedVol: number
  /** Volatility of volatility (vol surface variability) */
  volOfVol: number
  /** 25-delta skew */
  skew25Delta: number
  /** Kurtosis of volatility distribution */
  kurtosis: number
  /** Total arbitrage violations */
  totalViolations: number
  /** Calendar spread violations */
  calendarViolations: number
  /** Butterfly spread violations */
  butterflyViolations: number
  /** Surface quality score (0-100) */
  surfaceQuality: number
}

// ============================================================================
// Correction Results
// ============================================================================

/**
 * QP correction results
 */
export interface CorrectionResults {
  /** Number of violations before correction */
  originalViolations: number
  /** Number of violations after correction */
  remainingViolations: number
  /** Maximum adjustment applied */
  maxAdjustment: number
  /** Average adjustment applied */
  avgAdjustment: number
  /** Total points that were corrected */
  totalPointsCorrected: number
}

// ============================================================================
// Surface Statistics
// ============================================================================

/**
 * Volatility surface statistics
 */
export interface SurfaceStatistics {
  /** Total number of points in surface */
  totalPoints: number
  /** Number of unique strikes */
  uniqueStrikes: number
  /** Number of unique maturities */
  uniqueMaturities: number
  /** Data quality score (0-100) */
  dataQuality: number
  /** Minimum implied volatility */
  minVol: number
  /** Maximum implied volatility */
  maxVol: number
  /** Mean implied volatility */
  meanVol: number
  /** Standard deviation of implied volatility */
  stdVol: number
}

// ============================================================================
// Analysis Report
// ============================================================================

/**
 * Complete analysis report data structure
 */
export interface AnalysisReport {
  /** Report metadata */
  metadata: ReportMetadata
  /** Analysis summary */
  summary: AnalysisSummary
  /** List of arbitrage violations */
  arbitrageViolations: ArbitrageViolation[]
  /** Correction results (optional - only if QP correction was run) */
  correctionResults?: CorrectionResults
  /** Surface statistics */
  surfaceStats: SurfaceStatistics
  /** Analysis parameters */
  parameters: {
    spotPrice: number
    riskFreeRate: number
    dividendYield: number
    strikeRange: [number, number]
    maturityRange: [number, number]
  }
}

// ============================================================================
// Report Generation Options
// ============================================================================

/**
 * Options for PDF report generation
 */
export interface ReportGenerationOptions {
  /** Include chart screenshots */
  includeCharts: boolean
  /** Include local volatility calculations */
  includeLocalVol: boolean
  /** Include Greeks analysis */
  includeGreeks: boolean
  /** Maximum violations to show in table */
  maxViolationsToShow: number
  /** Maximum surface points to show in table */
  maxPointsToShow: number
}

/**
 * Default report generation options
 */
export const DEFAULT_REPORT_OPTIONS: ReportGenerationOptions = {
  includeCharts: true,
  includeLocalVol: true,
  includeGreeks: true,
  maxViolationsToShow: 20,
  maxPointsToShow: 50,
}

// ============================================================================
// Chart Images for PDF
// ============================================================================

/**
 * Chart image data for PDF embedding
 */
export interface ReportChartImages {
  /** 3D volatility surface screenshot */
  volatilitySurface?: string
  /** Volatility smile chart */
  smileChart?: string
  /** Term structure chart */
  termStructure?: string
  /** Local vol surface (if included) */
  localVolSurface?: string
}

// ============================================================================
// Greeks for Report
// ============================================================================

/**
 * Greeks summary for report
 */
export interface ReportGreeks {
  /** Delta - price sensitivity */
  delta: number
  /** Gamma - delta sensitivity */
  gamma: number
  /** Vega - volatility sensitivity */
  vega: number
  /** Theta - time decay */
  theta: number
  /** Rho - rate sensitivity */
  rho: number
}

// ============================================================================
// Surface Point for Report
// ============================================================================

/**
 * Surface point data for report tables
 */
export interface ReportSurfacePoint {
  /** Strike price */
  strike: number
  /** Time to maturity */
  maturity: number
  /** Implied volatility */
  impliedVol: number
  /** Local volatility (optional) */
  localVol?: number
}
