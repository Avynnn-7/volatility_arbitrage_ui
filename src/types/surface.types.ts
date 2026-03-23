/**
 * Volatility surface-related type definitions
 */

import type { SurfaceData, SurfaceStats } from './api.types'

// ============================================================================
// Volatility Surface Point Types (for Local Vol calculations)
// ============================================================================

/**
 * A single point on the volatility surface
 * Used for local volatility calculations (Dupire formula)
 */
export interface VolatilitySurfacePoint {
  strike: number
  maturity: number
  impliedVol: number
}

// ============================================================================
// Surface Display Types
// ============================================================================

/**
 * Single point on the volatility surface
 */
export interface SurfacePoint {
  strike: number
  expiry: number
  iv: number
  normalizedStrike?: number  // K/S or log-moneyness
  normalizedExpiry?: number  // sqrt(T)
}

/**
 * Grid cell for surface visualization
 */
export interface SurfaceCell {
  rowIndex: number
  colIndex: number
  strike: number
  expiry: number
  iv: number
  color: string
  isSelected?: boolean
  hasViolation?: boolean
  violationType?: 'butterfly' | 'calendar'
}

/**
 * Surface slice (fixed strike or fixed expiry)
 */
export interface SurfaceSlice {
  type: 'strike' | 'expiry'
  fixedValue: number
  points: Array<{
    x: number  // expiry or strike
    y: number  // IV
  }>
}

// ============================================================================
// Surface Configuration
// ============================================================================

/**
 * Surface visualization settings
 */
export interface SurfaceDisplayConfig {
  colorScale: 'viridis' | 'plasma' | 'rainbow' | 'coolwarm'
  showWireframe: boolean
  showGrid: boolean
  showAxes: boolean
  showLabels: boolean
  opacity: number
  resolution: 'low' | 'medium' | 'high'
}

/**
 * Surface camera settings for 3D view
 */
export interface SurfaceCameraConfig {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  zoom: number
}

/**
 * Default surface display configuration
 */
export const DEFAULT_SURFACE_CONFIG: SurfaceDisplayConfig = {
  colorScale: 'coolwarm',
  showWireframe: false,
  showGrid: true,
  showAxes: true,
  showLabels: true,
  opacity: 1.0,
  resolution: 'medium',
}

/**
 * Default camera configuration
 */
export const DEFAULT_CAMERA_CONFIG: SurfaceCameraConfig = {
  position: [2, 2, 2],
  target: [0, 0, 0],
  fov: 50,
  zoom: 1,
}

// ============================================================================
// Surface State Types
// ============================================================================

/**
 * Surface loading state
 */
export interface SurfaceLoadingState {
  isLoading: boolean
  isBuilding: boolean
  isExporting: boolean
  progress?: number
  message?: string
}

/**
 * Surface error state
 */
export interface SurfaceErrorState {
  hasError: boolean
  code?: string
  message?: string
  field?: string
}

/**
 * Complete surface state
 */
export interface SurfaceState {
  // Data
  currentSurface: SurfaceData | null
  correctedSurface: SurfaceData | null
  surfaceHistory: SurfaceData[]
  
  // Selection
  selectedCell: SurfaceCell | null
  selectedSlice: SurfaceSlice | null
  
  // Configuration
  displayConfig: SurfaceDisplayConfig
  cameraConfig: SurfaceCameraConfig
  
  // Status
  loading: SurfaceLoadingState
  error: SurfaceErrorState
}

// ============================================================================
// Surface Comparison Types
// ============================================================================

/**
 * Difference between two surfaces
 */
export interface SurfaceDiff {
  strikes: number[]
  expiries: number[]
  diffGrid: number[][]  // corrected - original
  maxDiff: number
  avgDiff: number
  rmsDiff: number  // Root mean square difference
}

/**
 * Surface comparison state
 */
export interface SurfaceComparison {
  originalId: string
  correctedId: string
  diff: SurfaceDiff
  original: SurfaceStats
  corrected: SurfaceStats
}
