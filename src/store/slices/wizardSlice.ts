import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  WizardState,
  WizardStep,
  DataInputMethod,
  StepValidation,
  QuoteInput,
  SurfaceData,
  ArbitrageDetectionResult,
  CorrectionResponse,
} from '@/types'
import { INITIAL_WIZARD_STATE, WIZARD_STEPS } from '@/types'

/**
 * Initial wizard state
 */
const initialState: WizardState = INITIAL_WIZARD_STATE

/**
 * Helper to get step index
 */
const getStepIndex = (step: WizardStep): number => {
  return WIZARD_STEPS.findIndex((s) => s.id === step)
}

/**
 * Wizard state slice
 */
const wizardSlice = createSlice({
  name: 'wizard',
  initialState,
  reducers: {
    // ========================================================================
    // Navigation Actions
    // ========================================================================
    
    /**
     * Go to next step
     */
    nextStep: (state) => {
      const currentIndex = getStepIndex(state.currentStep)
      if (currentIndex < WIZARD_STEPS.length - 1) {
        // Mark current step as completed
        if (!state.completedSteps.includes(state.currentStep)) {
          state.completedSteps.push(state.currentStep)
        }
        state.currentStep = WIZARD_STEPS[currentIndex + 1].id
      }
    },

    /**
     * Go to previous step
     */
    prevStep: (state) => {
      const currentIndex = getStepIndex(state.currentStep)
      if (currentIndex > 0) {
        state.currentStep = WIZARD_STEPS[currentIndex - 1].id
      }
    },

    /**
     * Go to specific step
     */
    goToStep: (state, action: PayloadAction<WizardStep>) => {
      const targetIndex = getStepIndex(action.payload)
      const currentIndex = getStepIndex(state.currentStep)
      
      // Can only go back or to completed steps or next step
      if (targetIndex <= currentIndex || state.completedSteps.includes(action.payload)) {
        state.currentStep = action.payload
      }
    },

    /**
     * Reset wizard to initial state
     */
    resetWizard: () => initialState,

    // ========================================================================
    // Data Input Actions
    // ========================================================================
    
    /**
     * Set input method
     */
    setInputMethod: (state, action: PayloadAction<DataInputMethod>) => {
      state.dataInput.method = action.payload
    },

    /**
     * Set raw data
     */
    setRawData: (state, action: PayloadAction<string>) => {
      state.dataInput.rawData = action.payload
    },

    /**
     * Set parsed quotes
     */
    setParsedQuotes: (state, action: PayloadAction<QuoteInput[]>) => {
      state.dataInput.parsedQuotes = action.payload
      state.dataInput.isValid = action.payload.length > 0
      state.dataInput.validationErrors = []
    },

    /**
     * Set market data
     */
    setMarketData: (state, action: PayloadAction<Partial<WizardState['dataInput']['marketData']>>) => {
      state.dataInput.marketData = { ...state.dataInput.marketData, ...action.payload }
    },

    /**
     * Set validation errors
     */
    setValidationErrors: (state, action: PayloadAction<string[]>) => {
      state.dataInput.validationErrors = action.payload
      state.dataInput.isValid = action.payload.length === 0
    },

    // ========================================================================
    // Result Actions
    // ========================================================================
    
    /**
     * Set surface data
     */
    setSurface: (state, action: PayloadAction<SurfaceData | null>) => {
      state.surface = action.payload
    },

    /**
     * Set detection result
     */
    setDetectionResult: (state, action: PayloadAction<ArbitrageDetectionResult | null>) => {
      state.detectionResult = action.payload
    },

    /**
     * Set correction response
     */
    setCorrectionResponse: (state, action: PayloadAction<CorrectionResponse | null>) => {
      state.correctionResponse = action.payload
    },

    // ========================================================================
    // Validation Actions
    // ========================================================================
    
    /**
     * Set step validation
     */
    setStepValidation: (state, action: PayloadAction<{ step: WizardStep; validation: StepValidation }>) => {
      state.stepValidation[action.payload.step] = action.payload.validation
    },

    // ========================================================================
    // Status Actions
    // ========================================================================
    
    /**
     * Set processing state
     */
    setProcessing: (state, action: PayloadAction<{ isProcessing: boolean; step?: WizardStep }>) => {
      state.isProcessing = action.payload.isProcessing
      state.processingStep = action.payload.step ?? null
    },

    /**
     * Set error
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  nextStep,
  prevStep,
  goToStep,
  resetWizard,
  setInputMethod,
  setRawData,
  setParsedQuotes,
  setMarketData,
  setValidationErrors,
  setSurface,
  setDetectionResult,
  setCorrectionResponse,
  setStepValidation,
  setProcessing,
  setError,
  clearError,
} = wizardSlice.actions

// Re-export for compatibility with useWizardState hook
export const setCurrentStep = goToStep
export const completeStep = (step: WizardStep) => {
  return { type: 'wizard/completeStep', payload: step }
}
export const updateWizardData = (data: Partial<WizardState['dataInput']>) => {
  return setMarketData(data.marketData || {})
}

// Export WizardData type alias for the hook
export type WizardData = WizardState['dataInput']

export const wizardReducer = wizardSlice.reducer
