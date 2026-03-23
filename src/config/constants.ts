/**
 * Application constants
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
export const API_TIMEOUT = 30000 // 30 seconds

// Application Info
export const APP_NAME = 'Vol-Arb'
export const APP_VERSION = '1.0.0'
export const APP_DESCRIPTION = 'Professional Volatility Arbitrage Dashboard'

// Feature Flags
export const FEATURES = {
  ENABLE_3D: true,
  ENABLE_EXPORT_PDF: true,
  ENABLE_DARK_MODE: true,
  ENABLE_MOCK_API: import.meta.env.DEV && !import.meta.env.VITE_API_URL,
} as const

// Volatility Surface Defaults
export const SURFACE_DEFAULTS = {
  MIN_STRIKE: 0,
  MAX_STRIKE: 10000,
  MIN_EXPIRY: 0,
  MAX_EXPIRY: 10,
  MIN_IV: 0.01,
  MAX_IV: 5.0,
} as const

// Color Scale for IV visualization
export const IV_COLOR_SCALE = [
  { stop: 0.0, color: '#3b82f6' },  // Blue (low IV)
  { stop: 0.2, color: '#06b6d4' },  // Cyan
  { stop: 0.4, color: '#10b981' },  // Green
  { stop: 0.6, color: '#f59e0b' },  // Amber
  { stop: 0.8, color: '#f97316' },  // Orange
  { stop: 1.0, color: '#ef4444' },  // Red (high IV)
] as const

// Arbitrage Severity Colors
export const SEVERITY_COLORS = {
  low: '#f59e0b',      // Warning yellow
  medium: '#f97316',   // Orange
  high: '#ef4444',     // Error red
  critical: '#dc2626', // Dark red
} as const

// Default Market Data
export const DEFAULT_MARKET_DATA = {
  spot: 100,
  riskFreeRate: 0.05,
  dividendYield: 0.02,
  currency: 'USD',
} as const
