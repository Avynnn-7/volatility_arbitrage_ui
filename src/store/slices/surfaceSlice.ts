import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { 
  SurfaceData, 
  SurfaceCell, 
  SurfaceSlice as SurfaceSliceType,
  SurfaceDisplayConfig,
  SurfaceCameraConfig,
  SurfaceState,
} from '@/types'
import { DEFAULT_SURFACE_CONFIG, DEFAULT_CAMERA_CONFIG } from '@/types'

/**
 * Initial surface state
 */
const initialState: SurfaceState = {
  currentSurface: null,
  correctedSurface: null,
  surfaceHistory: [],
  selectedCell: null,
  selectedSlice: null,
  displayConfig: DEFAULT_SURFACE_CONFIG,
  cameraConfig: DEFAULT_CAMERA_CONFIG,
  loading: {
    isLoading: false,
    isBuilding: false,
    isExporting: false,
  },
  error: {
    hasError: false,
  },
}

/**
 * Surface state slice
 */
const surfaceSlice = createSlice({
  name: 'surface',
  initialState,
  reducers: {
    // ========================================================================
    // Surface Data Actions
    // ========================================================================
    
    /**
     * Set the current surface
     */
    setCurrentSurface: (state, action: PayloadAction<SurfaceData | null>) => {
      if (state.currentSurface) {
        // Add to history
        state.surfaceHistory.unshift(state.currentSurface)
        // Keep only last 10 surfaces
        state.surfaceHistory = state.surfaceHistory.slice(0, 10)
      }
      state.currentSurface = action.payload
      state.error = { hasError: false }
    },

    /**
     * Set the corrected surface
     */
    setCorrectedSurface: (state, action: PayloadAction<SurfaceData | null>) => {
      state.correctedSurface = action.payload
    },

    /**
     * Clear all surfaces
     */
    clearSurfaces: (state) => {
      state.currentSurface = null
      state.correctedSurface = null
      state.selectedCell = null
      state.selectedSlice = null
    },

    // ========================================================================
    // Selection Actions
    // ========================================================================
    
    /**
     * Set selected cell
     */
    setSelectedCell: (state, action: PayloadAction<SurfaceCell | null>) => {
      state.selectedCell = action.payload
    },

    /**
     * Set selected slice
     */
    setSelectedSlice: (state, action: PayloadAction<SurfaceSliceType | null>) => {
      state.selectedSlice = action.payload
    },

    // ========================================================================
    // Configuration Actions
    // ========================================================================
    
    /**
     * Update display configuration
     */
    updateDisplayConfig: (state, action: PayloadAction<Partial<SurfaceDisplayConfig>>) => {
      state.displayConfig = { ...state.displayConfig, ...action.payload }
    },

    /**
     * Update camera configuration
     */
    updateCameraConfig: (state, action: PayloadAction<Partial<SurfaceCameraConfig>>) => {
      state.cameraConfig = { ...state.cameraConfig, ...action.payload }
    },

    /**
     * Reset display configuration to defaults
     */
    resetDisplayConfig: (state) => {
      state.displayConfig = DEFAULT_SURFACE_CONFIG
    },

    /**
     * Reset camera configuration to defaults
     */
    resetCameraConfig: (state) => {
      state.cameraConfig = DEFAULT_CAMERA_CONFIG
    },

    // ========================================================================
    // Loading Actions
    // ========================================================================
    
    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<Partial<SurfaceState['loading']>>) => {
      state.loading = { ...state.loading, ...action.payload }
    },

    // ========================================================================
    // Error Actions
    // ========================================================================
    
    /**
     * Set error state
     */
    setError: (state, action: PayloadAction<Partial<SurfaceState['error']>>) => {
      state.error = { ...state.error, hasError: true, ...action.payload }
    },

    /**
     * Clear error state
     */
    clearError: (state) => {
      state.error = { hasError: false }
    },
  },
})

export const {
  setCurrentSurface,
  setCorrectedSurface,
  clearSurfaces,
  setSelectedCell,
  setSelectedSlice,
  updateDisplayConfig,
  updateCameraConfig,
  resetDisplayConfig,
  resetCameraConfig,
  setLoading,
  setError,
  clearError,
} = surfaceSlice.actions

export const surfaceReducer = surfaceSlice.reducer
