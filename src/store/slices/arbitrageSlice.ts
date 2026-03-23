import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  ArbitrageState,
  ArbitrageDetectionResult,
  CorrectionResult,
  DualCertificate,
  ArbitrageViolation,
  ViolationDisplayConfig,
  DetectionStatus,
  CorrectionStatus,
} from '@/types'
import { DEFAULT_VIOLATION_CONFIG } from '@/types'

/**
 * Initial arbitrage state
 */
const initialState: ArbitrageState = {
  detectionResult: null,
  detectionStatus: 'idle',
  detectionError: null,
  correctionResult: null,
  correctionStatus: 'idle',
  correctionError: null,
  dualCertificate: null,
  isVerified: false,
  displayConfig: DEFAULT_VIOLATION_CONFIG,
  selectedViolation: null,
}

/**
 * Arbitrage state slice
 */
const arbitrageSlice = createSlice({
  name: 'arbitrage',
  initialState,
  reducers: {
    // ========================================================================
    // Detection Actions
    // ========================================================================
    
    /**
     * Set detection status
     */
    setDetectionStatus: (state, action: PayloadAction<DetectionStatus>) => {
      state.detectionStatus = action.payload
      if (action.payload === 'detecting') {
        state.detectionError = null
      }
    },

    /**
     * Set detection result
     */
    setDetectionResult: (state, action: PayloadAction<ArbitrageDetectionResult | null>) => {
      state.detectionResult = action.payload
      state.detectionStatus = action.payload ? 'complete' : 'idle'
    },

    /**
     * Set detection error
     */
    setDetectionError: (state, action: PayloadAction<string>) => {
      state.detectionError = action.payload
      state.detectionStatus = 'error'
    },

    // ========================================================================
    // Correction Actions
    // ========================================================================
    
    /**
     * Set correction status
     */
    setCorrectionStatus: (state, action: PayloadAction<CorrectionStatus>) => {
      state.correctionStatus = action.payload
      if (action.payload === 'correcting') {
        state.correctionError = null
      }
    },

    /**
     * Set correction result
     */
    setCorrectionResult: (state, action: PayloadAction<CorrectionResult | null>) => {
      state.correctionResult = action.payload
      state.correctionStatus = action.payload ? 'complete' : 'idle'
    },

    /**
     * Set correction error
     */
    setCorrectionError: (state, action: PayloadAction<string>) => {
      state.correctionError = action.payload
      state.correctionStatus = 'error'
    },

    // ========================================================================
    // Verification Actions
    // ========================================================================
    
    /**
     * Set dual certificate
     */
    setDualCertificate: (state, action: PayloadAction<DualCertificate | null>) => {
      state.dualCertificate = action.payload
      state.isVerified = action.payload?.isOptimal ?? false
    },

    // ========================================================================
    // Configuration Actions
    // ========================================================================
    
    /**
     * Update violation display config
     */
    updateDisplayConfig: (state, action: PayloadAction<Partial<ViolationDisplayConfig>>) => {
      state.displayConfig = { ...state.displayConfig, ...action.payload }
    },

    /**
     * Reset display config to defaults
     */
    resetDisplayConfig: (state) => {
      state.displayConfig = DEFAULT_VIOLATION_CONFIG
    },

    // ========================================================================
    // Selection Actions
    // ========================================================================
    
    /**
     * Set selected violation
     */
    setSelectedViolation: (state, action: PayloadAction<ArbitrageViolation | null>) => {
      state.selectedViolation = action.payload
    },

    // ========================================================================
    // Reset Actions
    // ========================================================================
    
    /**
     * Reset all arbitrage state
     */
    resetArbitrageState: () => initialState,

    /**
     * Clear errors only
     */
    clearErrors: (state) => {
      state.detectionError = null
      state.correctionError = null
    },
  },
})

export const {
  setDetectionStatus,
  setDetectionResult,
  setDetectionError,
  setCorrectionStatus,
  setCorrectionResult,
  setCorrectionError,
  setDualCertificate,
  updateDisplayConfig,
  resetDisplayConfig,
  setSelectedViolation,
  resetArbitrageState,
  clearErrors,
} = arbitrageSlice.actions

export const arbitrageReducer = arbitrageSlice.reducer
