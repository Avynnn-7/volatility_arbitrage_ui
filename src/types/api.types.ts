/**
 * API-related type definitions
 * Matches the Vol-Arb C++ backend API contract
 */

// ============================================================================
// API Response Wrapper Types
// ============================================================================

/**
 * Standard API error response
 */
export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data?: T
  error?: ApiError
  status: number
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  version: string
  uptime: number
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Market quote input (minimal API format)
 */
export interface QuoteInputAPI {
  strike: number
  expiry: number
  iv: number
}

/**
 * Market quote input (extended UI format)
 * Used throughout the wizard and analysis components
 */
export interface QuoteInput {
  strike: number
  /** Time to expiry in years (alias: expiry) */
  maturity: number
  /** Implied volatility as decimal (alias: iv) */
  impliedVol: number
  /** Option type */
  optionType?: 'call' | 'put'
  /** Bid price */
  bid?: number
  /** Ask price */
  ask?: number
  /** Mid price */
  mid?: number
}

/**
 * Convert API quote format to UI quote format
 */
export function apiQuoteToUIQuote(apiQuote: QuoteInputAPI): QuoteInput {
  return {
    strike: apiQuote.strike,
    maturity: apiQuote.expiry,
    impliedVol: apiQuote.iv,
  }
}

/**
 * Convert UI quote format to API quote format
 */
export function uiQuoteToAPIQuote(uiQuote: QuoteInput): QuoteInputAPI {
  return {
    strike: uiQuote.strike,
    expiry: uiQuote.maturity,
    iv: uiQuote.impliedVol,
  }
}

/**
 * Market data input for surface construction
 */
export interface MarketDataInput {
  spot: number
  riskFreeRate?: number
  dividendYield?: number
  valuationDate?: string
  currency?: string
  quotes: QuoteInput[]
}

/**
 * Surface creation request
 */
export interface CreateSurfaceRequest {
  spot: number
  riskFreeRate?: number
  dividendYield?: number
  valuationDate?: string
  currency?: string
  quotes: QuoteInput[]
}

/**
 * Arbitrage detection request
 */
export interface DetectArbitrageRequest {
  surfaceId?: string
  surface?: SurfaceData
}

/**
 * QP correction request
 */
export interface CorrectArbitrageRequest {
  surfaceId: string
}

/**
 * Local volatility request
 */
export interface LocalVolRequest {
  surfaceId: string
}

/**
 * Dual certificate request
 */
export interface DualCertificateRequest {
  surfaceId: string
  correctionResult?: CorrectionResult
}

/**
 * Export request
 */
export interface ExportRequest {
  surfaceId: string
  format: 'json' | 'csv'
  includeCorrected?: boolean
  includeViolations?: boolean
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Surface statistics
 */
export interface SurfaceStats {
  minIV: number
  maxIV: number
  avgIV: number
  atmIV: number
  strikeCount: number
  expiryCount: number
}

/**
 * Volatility surface data
 */
export interface SurfaceData {
  id: string
  strikes: number[]
  expiries: number[]
  ivGrid: number[][]
  stats: SurfaceStats
  createdAt: string
  marketData: {
    spot: number
    riskFreeRate: number
    dividendYield: number
    valuationDate: string
    currency: string
  }
}

/**
 * Arbitrage violation
 */
export interface ArbitrageViolation {
  type: 'butterfly' | 'calendar'
  strike: number
  expiry: number
  expiry2?: number  // For calendar spreads
  severity: 'low' | 'medium' | 'high' | 'critical'
  value: number
  description: string
}

/**
 * Arbitrage detection summary
 */
export interface ArbitrageSummary {
  totalViolations: number
  butterflyViolations: number
  calendarViolations: number
  severityCounts: {
    low: number
    medium: number
    high: number
    critical: number
  }
}

/**
 * Arbitrage detection result
 */
export interface ArbitrageDetectionResult {
  surfaceId: string
  isArbitrageFree: boolean
  violations: ArbitrageViolation[]
  summary: ArbitrageSummary
}

/**
 * QP correction result
 */
export interface CorrectionResult {
  status: 'optimal' | 'suboptimal' | 'failed'
  objectiveValue: number
  iterations: number
  maxCorrection: number
  avgCorrection: number
}

/**
 * Full correction response
 */
export interface CorrectionResponse {
  originalSurfaceId: string
  correctedSurfaceId: string
  correctedSurface: SurfaceData
  correction: CorrectionResult
  verification: {
    isArbitrageFree: boolean
    residualViolations: number
  }
}

/**
 * Local volatility surface data
 */
export interface LocalVolSurface {
  surfaceId: string
  strikes: number[]
  expiries: number[]
  localVolGrid: number[][]
}

/**
 * Dual certificate (KKT verification)
 */
export interface DualCertificate {
  isOptimal: boolean
  kktSatisfied: boolean
  stationarityNorm: number
  complementarySlackness: number
  primalFeasibility: boolean
  dualFeasibility: boolean
}

// ============================================================================
// API Endpoint Types
// ============================================================================

/**
 * API endpoints enum
 */
export const API_ENDPOINTS = {
  HEALTH: '/health',
  SURFACE: '/surface',
  ARBITRAGE_DETECT: '/arbitrage/detect',
  ARBITRAGE_CORRECT: '/arbitrage/correct',
  LOCALVOL: '/localvol',
  CERTIFICATE: '/certificate',
  EXPORT_JSON: '/export/json',
  EXPORT_CSV: '/export/csv',
} as const

export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS]

// ============================================================================
// UI-Specific Types (Wizard & Analysis)
// ============================================================================

/**
 * Arbitrage opportunity detected in the surface
 * Used in wizard steps for display and analysis
 */
export interface ArbitrageOpportunity {
  /** Unique identifier */
  id: string
  /** Type of arbitrage */
  type: 'calendar' | 'butterfly' | 'vertical'
  /** First strike involved */
  strike1?: number
  /** Second strike (butterfly spreads) */
  strike2?: number
  /** Third strike (butterfly spreads) */
  strike3?: number
  /** First maturity involved */
  maturity1?: number
  /** Second maturity (calendar spreads) */
  maturity2?: number
  /** Severity score 0-1 */
  severity: number
  /** Expected profit from the arbitrage */
  expectedProfit?: number
  /** Human-readable description */
  description?: string
}
