/**
 * Mock data for development and testing
 * Used when backend is not available
 */

import type {
  SurfaceData,
  ArbitrageDetectionResult,
  CorrectionResponse,
  QuoteInput,
  HealthCheckResponse,
  ArbitrageViolation,
} from '@/types'

/**
 * Sample quotes data
 */
export const SAMPLE_QUOTES: QuoteInput[] = [
  // T = 0.25 (3 months)
  { strike: 90, maturity: 0.25, impliedVol: 0.25 },
  { strike: 95, maturity: 0.25, impliedVol: 0.22 },
  { strike: 100, maturity: 0.25, impliedVol: 0.20 },
  { strike: 105, maturity: 0.25, impliedVol: 0.21 },
  { strike: 110, maturity: 0.25, impliedVol: 0.24 },
  
  // T = 0.5 (6 months)
  { strike: 90, maturity: 0.5, impliedVol: 0.24 },
  { strike: 95, maturity: 0.5, impliedVol: 0.21 },
  { strike: 100, maturity: 0.5, impliedVol: 0.19 },
  { strike: 105, maturity: 0.5, impliedVol: 0.20 },
  { strike: 110, maturity: 0.5, impliedVol: 0.23 },
  
  // T = 1.0 (1 year)
  { strike: 90, maturity: 1.0, impliedVol: 0.23 },
  { strike: 95, maturity: 1.0, impliedVol: 0.20 },
  { strike: 100, maturity: 1.0, impliedVol: 0.18 },
  { strike: 105, maturity: 1.0, impliedVol: 0.19 },
  { strike: 110, maturity: 1.0, impliedVol: 0.22 },
  
  // T = 2.0 (2 years)
  { strike: 90, maturity: 2.0, impliedVol: 0.22 },
  { strike: 95, maturity: 2.0, impliedVol: 0.19 },
  { strike: 100, maturity: 2.0, impliedVol: 0.17 },
  { strike: 105, maturity: 2.0, impliedVol: 0.18 },
  { strike: 110, maturity: 2.0, impliedVol: 0.21 },
]

/**
 * Generate mock health check response
 */
export function mockHealthCheck(): HealthCheckResponse {
  return {
    status: 'healthy',
    version: '2.0.0',
    uptime: Math.floor(Math.random() * 100000),
  }
}

/**
 * Generate mock surface data
 */
export function mockSurfaceData(id?: string): SurfaceData {
  const strikes = [90, 95, 100, 105, 110]
  const expiries = [0.25, 0.5, 1.0, 2.0]
  
  // Generate IV grid with typical smile/skew pattern
  const ivGrid = expiries.map((t) => 
    strikes.map((k) => {
      const moneyness = Math.log(k / 100)
      const atmVol = 0.18 + 0.02 * Math.sqrt(t)  // ATM vol increases with time
      const skew = -0.1 * moneyness              // OTM puts have higher vol
      const smile = 0.05 * moneyness * moneyness // Smile curvature
      return atmVol + skew + smile + (Math.random() - 0.5) * 0.01
    })
  )
  
  return {
    id: id || `surf_${Date.now()}`,
    strikes,
    expiries,
    ivGrid,
    stats: {
      minIV: Math.min(...ivGrid.flat()),
      maxIV: Math.max(...ivGrid.flat()),
      avgIV: ivGrid.flat().reduce((a, b) => a + b) / ivGrid.flat().length,
      atmIV: ivGrid[0][2],  // K=100, T=0.25
      strikeCount: strikes.length,
      expiryCount: expiries.length,
    },
    createdAt: new Date().toISOString(),
    marketData: {
      spot: 100,
      riskFreeRate: 0.05,
      dividendYield: 0.02,
      valuationDate: new Date().toISOString().split('T')[0],
      currency: 'USD',
    },
  }
}

/**
 * Generate mock arbitrage detection result
 */
export function mockDetectionResult(surfaceId: string, hasViolations = true): ArbitrageDetectionResult {
  const violations: ArbitrageViolation[] = hasViolations ? [
    {
      type: 'butterfly',
      strike: 100,
      expiry: 0.25,
      severity: 'high',
      value: -0.0023,
      description: 'Negative butterfly spread at K=100, T=0.25',
    },
    {
      type: 'calendar',
      strike: 95,
      expiry: 0.25,
      expiry2: 0.5,
      severity: 'medium',
      value: 0.005,
      description: 'Calendar spread violation at K=95',
    },
    {
      type: 'butterfly',
      strike: 105,
      expiry: 0.5,
      severity: 'low',
      value: -0.0008,
      description: 'Negative butterfly spread at K=105, T=0.5',
    },
  ] : []
  
  return {
    surfaceId,
    isArbitrageFree: violations.length === 0,
    violations,
    summary: {
      totalViolations: violations.length,
      butterflyViolations: violations.filter(v => v.type === 'butterfly').length,
      calendarViolations: violations.filter(v => v.type === 'calendar').length,
      severityCounts: {
        low: violations.filter(v => v.severity === 'low').length,
        medium: violations.filter(v => v.severity === 'medium').length,
        high: violations.filter(v => v.severity === 'high').length,
        critical: violations.filter(v => v.severity === 'critical').length,
      },
    },
  }
}

/**
 * Generate mock correction response
 */
export function mockCorrectionResponse(surfaceId: string): CorrectionResponse {
  const correctedSurface = mockSurfaceData(`${surfaceId}_corrected`)
  
  return {
    originalSurfaceId: surfaceId,
    correctedSurfaceId: correctedSurface.id,
    correctedSurface,
    correction: {
      status: 'optimal',
      objectiveValue: 0.000234,
      iterations: 15,
      maxCorrection: 0.012,
      avgCorrection: 0.003,
    },
    verification: {
      isArbitrageFree: true,
      residualViolations: 0,
    },
  }
}

/**
 * Full sample market data for upload
 */
export const SAMPLE_MARKET_DATA = {
  spot: 100,
  riskFreeRate: 0.05,
  dividendYield: 0.02,
  valuationDate: new Date().toISOString().split('T')[0],
  currency: 'USD',
  quotes: SAMPLE_QUOTES,
}

/**
 * JSON string of sample data (for paste input)
 */
export const SAMPLE_JSON_STRING = JSON.stringify(SAMPLE_MARKET_DATA, null, 2)
