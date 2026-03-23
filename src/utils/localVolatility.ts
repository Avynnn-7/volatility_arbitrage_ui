/**
 * Local Volatility Calculation using Dupire's Formula
 * 
 * Dupire's formula relates local volatility to implied volatility:
 * sigma_local^2(K,T) = (dC/dT + rK*dC/dK + qS*dC/dS) / (0.5*K^2*d^2C/dK^2)
 * 
 * In terms of implied volatility:
 * sigma_local^2(K,T) = (dsigma_imp/dT + 2*sigma_imp/T + ...) / (...)
 */

import type { VolatilitySurfacePoint } from '@/types/surface.types'

// ============================================================================
// Types
// ============================================================================

export interface LocalVolPoint {
  strike: number
  maturity: number
  impliedVol: number
  localVol: number
  isValid: boolean
}

export interface LocalVolSurfaceData {
  points: LocalVolPoint[]
  strikes: number[]
  maturities: number[]
  minLocalVol: number
  maxLocalVol: number
  spotPrice: number
  riskFreeRate: number
  dividendYield: number
}

// ============================================================================
// Mathematical Functions
// ============================================================================

/**
 * Standard normal CDF approximation (Abramowitz & Stegun)
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  const absX = Math.abs(x)

  const t = 1.0 / (1.0 + p * absX)
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX / 2)

  return 0.5 * (1.0 + sign * y)
}

/**
 * Calculate d1 and d2 for Black-Scholes
 */
function calculateD1D2(
  S: number,
  K: number,
  T: number,
  r: number,
  q: number,
  sigma: number
): { d1: number; d2: number } {
  const sqrtT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT
  return { d1, d2 }
}

/**
 * Black-Scholes call price
 */
function blackScholesCall(
  S: number,
  K: number,
  T: number,
  r: number,
  q: number,
  sigma: number
): number {
  if (T <= 0 || sigma <= 0) return Math.max(0, S * Math.exp(-q * T) - K * Math.exp(-r * T))
  
  const { d1, d2 } = calculateD1D2(S, K, T, r, q, sigma)
  return S * Math.exp(-q * T) * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2)
}

/**
 * Numerical partial derivative with respect to strike (dC/dK)
 */
function dCdK(
  S: number,
  K: number,
  T: number,
  r: number,
  q: number,
  sigma: number,
  dK: number = 0.01
): number {
  const C_up = blackScholesCall(S, K + dK, T, r, q, sigma)
  const C_down = blackScholesCall(S, K - dK, T, r, q, sigma)
  return (C_up - C_down) / (2 * dK)
}

/**
 * Numerical second partial derivative with respect to strike (d^2C/dK^2)
 */
function d2CdK2(
  S: number,
  K: number,
  T: number,
  r: number,
  q: number,
  sigma: number,
  dK: number = 0.01
): number {
  const C_up = blackScholesCall(S, K + dK, T, r, q, sigma)
  const C_mid = blackScholesCall(S, K, T, r, q, sigma)
  const C_down = blackScholesCall(S, K - dK, T, r, q, sigma)
  return (C_up - 2 * C_mid + C_down) / (dK * dK)
}

/**
 * Numerical partial derivative with respect to time (dC/dT)
 */
function dCdT(
  S: number,
  K: number,
  T: number,
  r: number,
  q: number,
  sigma: number,
  dT: number = 0.001
): number {
  if (T <= dT) return 0
  const C_up = blackScholesCall(S, K, T + dT, r, q, sigma)
  const C_down = blackScholesCall(S, K, T - dT, r, q, sigma)
  return (C_up - C_down) / (2 * dT)
}

// ============================================================================
// Core Local Volatility Functions
// ============================================================================

/**
 * Calculate local volatility using Dupire's formula
 * 
 * sigma_local^2(K,T) = (dC/dT + (r-q)K*dC/dK + q*C) / (0.5*K^2*d^2C/dK^2)
 */
export function calculateLocalVolatility(
  S: number,
  K: number,
  T: number,
  r: number,
  q: number,
  impliedVol: number
): number {
  // Minimum time to avoid numerical issues
  if (T < 0.01) return impliedVol
  
  const C = blackScholesCall(S, K, T, r, q, impliedVol)
  const dC_dT = dCdT(S, K, T, r, q, impliedVol)
  const dC_dK = dCdK(S, K, T, r, q, impliedVol)
  const d2C_dK2 = d2CdK2(S, K, T, r, q, impliedVol)
  
  // Numerator: dC/dT + (r-q)K*dC/dK + q*C
  const numerator = dC_dT + (r - q) * K * dC_dK + q * C
  
  // Denominator: 0.5*K^2*d^2C/dK^2
  const denominator = 0.5 * K * K * d2C_dK2
  
  // Check for valid denominator (must be positive for call options)
  if (denominator <= 1e-10) {
    return impliedVol // Fall back to implied vol
  }
  
  const localVolSquared = numerator / denominator
  
  // Local vol squared must be positive
  if (localVolSquared <= 0) {
    return impliedVol // Fall back to implied vol
  }
  
  return Math.sqrt(localVolSquared)
}

/**
 * Build local volatility surface from implied volatility data
 */
export function buildLocalVolSurface(
  impliedVolPoints: VolatilitySurfacePoint[],
  spotPrice: number,
  riskFreeRate: number = 0.05,
  dividendYield: number = 0.02
): LocalVolSurfaceData {
  const points: LocalVolPoint[] = []
  let minLocalVol = Infinity
  let maxLocalVol = -Infinity
  
  // Get unique strikes and maturities
  const strikesSet = new Set<number>()
  const maturitiesSet = new Set<number>()
  
  impliedVolPoints.forEach(point => {
    strikesSet.add(point.strike)
    maturitiesSet.add(point.maturity)
  })
  
  const strikes = Array.from(strikesSet).sort((a, b) => a - b)
  const maturities = Array.from(maturitiesSet).sort((a, b) => a - b)
  
  // Calculate local vol for each point
  impliedVolPoints.forEach(point => {
    const localVol = calculateLocalVolatility(
      spotPrice,
      point.strike,
      point.maturity,
      riskFreeRate,
      dividendYield,
      point.impliedVol
    )
    
    const isVolValid = !isNaN(localVol) && isFinite(localVol)
    const safeVol = isVolValid ? localVol : point.impliedVol
    
    // Validate local vol (should be reasonable, e.g., 0.01 to 2.0)
    const isValid = isVolValid && safeVol > 0.01 && safeVol < 2.0
    const clampedLocalVol = Math.max(0.01, Math.min(2.0, safeVol))
    
    if (isValid) {
      minLocalVol = Math.min(minLocalVol, clampedLocalVol)
      maxLocalVol = Math.max(maxLocalVol, clampedLocalVol)
    }
    
    points.push({
      strike: point.strike,
      maturity: point.maturity,
      impliedVol: point.impliedVol,
      localVol: clampedLocalVol,
      isValid
    })
  })
  
  // Handle edge case where no valid points
  if (minLocalVol === Infinity) minLocalVol = 0.1
  if (maxLocalVol === -Infinity) maxLocalVol = 0.5
  
  return {
    points,
    strikes,
    maturities,
    minLocalVol,
    maxLocalVol,
    spotPrice,
    riskFreeRate,
    dividendYield
  }
}

/**
 * Interpolate local vol at arbitrary (K, T) point using bilinear interpolation
 */
export function interpolateLocalVol(
  surface: LocalVolSurfaceData,
  strike: number,
  maturity: number
): number {
  const { strikes, maturities, points } = surface
  
  // Find surrounding strikes
  let k1 = strikes[0]
  let k2 = strikes[strikes.length - 1]
  for (let i = 0; i < strikes.length - 1; i++) {
    if (strikes[i] <= strike && strikes[i + 1] >= strike) {
      k1 = strikes[i]
      k2 = strikes[i + 1]
      break
    }
  }
  
  // Find surrounding maturities
  let t1 = maturities[0]
  let t2 = maturities[maturities.length - 1]
  for (let i = 0; i < maturities.length - 1; i++) {
    if (maturities[i] <= maturity && maturities[i + 1] >= maturity) {
      t1 = maturities[i]
      t2 = maturities[i + 1]
      break
    }
  }
  
  // Get local vols at four corners
  const getLocalVol = (k: number, t: number): number => {
    const point = points.find(p => 
      Math.abs(p.strike - k) < 0.001 && Math.abs(p.maturity - t) < 0.001
    )
    return point?.localVol ?? surface.minLocalVol
  }
  
  const v11 = getLocalVol(k1, t1)
  const v21 = getLocalVol(k2, t1)
  const v12 = getLocalVol(k1, t2)
  const v22 = getLocalVol(k2, t2)
  
  // Bilinear interpolation
  const kWeight = k2 !== k1 ? (strike - k1) / (k2 - k1) : 0
  const tWeight = t2 !== t1 ? (maturity - t1) / (t2 - t1) : 0
  
  const v1 = v11 + kWeight * (v21 - v11)
  const v2 = v12 + kWeight * (v22 - v12)
  
  return v1 + tWeight * (v2 - v1)
}

/**
 * Calculate statistics for local vol surface
 */
export function calculateLocalVolStats(surface: LocalVolSurfaceData): {
  mean: number
  std: number
  skew: number
  validPoints: number
  totalPoints: number
  atmLocalVol: number
} {
  const validPoints = surface.points.filter(p => p.isValid)
  const localVols = validPoints.map(p => p.localVol)
  
  const n = localVols.length
  if (n === 0) {
    return { mean: 0, std: 0, skew: 0, validPoints: 0, totalPoints: surface.points.length, atmLocalVol: 0 }
  }
  
  const mean = localVols.reduce((a, b) => a + b, 0) / n
  const variance = localVols.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n
  const std = Math.sqrt(variance)
  
  // Skewness
  const skew = std > 0 
    ? localVols.reduce((sum, v) => sum + ((v - mean) / std) ** 3, 0) / n 
    : 0
  
  // ATM local vol (strike closest to spot)
  const atmPoint = validPoints.reduce((closest, point) => 
    Math.abs(point.strike - surface.spotPrice) < Math.abs(closest.strike - surface.spotPrice)
      ? point
      : closest
  , validPoints[0])
  
  return {
    mean,
    std,
    skew,
    validPoints: validPoints.length,
    totalPoints: surface.points.length,
    atmLocalVol: atmPoint?.localVol ?? mean
  }
}

/**
 * Convert SurfaceData from Redux to VolatilitySurfacePoint array
 */
export function surfaceDataToPoints(
  strikes: number[],
  expiries: number[],
  ivGrid: number[][]
): VolatilitySurfacePoint[] {
  const points: VolatilitySurfacePoint[] = []
  
  for (let i = 0; i < expiries.length; i++) {
    for (let j = 0; j < strikes.length; j++) {
      points.push({
        strike: strikes[j],
        maturity: expiries[i],
        impliedVol: ivGrid[i][j]
      })
    }
  }
  
  return points
}
