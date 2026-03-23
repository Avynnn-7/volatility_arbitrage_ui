/**
 * Analysis wizard type definitions
 */

import type { QuoteInput, SurfaceData, ArbitrageDetectionResult, CorrectionResponse } from './api.types'

// ============================================================================
// Wizard Steps
// ============================================================================

/**
 * Wizard step identifiers
 */
export type WizardStep = 
  | 'data-input'
  | 'surface-preview'
  | 'arbitrage-detection'
  | 'correction'
  | 'export'

/**
 * Step configuration
 */
export interface WizardStepConfig {
  id: WizardStep
  title: string
  description: string
  icon: string
  isOptional: boolean
}

/**
 * All wizard steps configuration
 */
export const WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: 'data-input',
    title: 'Data Input',
    description: 'Upload or enter your volatility data',
    icon: 'Upload',
    isOptional: false,
  },
  {
    id: 'surface-preview',
    title: 'Surface Preview',
    description: 'Review your volatility surface',
    icon: 'Eye',
    isOptional: false,
  },
  {
    id: 'arbitrage-detection',
    title: 'Arbitrage Detection',
    description: 'Scan for arbitrage violations',
    icon: 'Search',
    isOptional: false,
  },
  {
    id: 'correction',
    title: 'QP Correction',
    description: 'Apply arbitrage-free projection',
    icon: 'Wrench',
    isOptional: true,  // Skip if no violations
  },
  {
    id: 'export',
    title: 'Export Results',
    description: 'Download your corrected surface',
    icon: 'Download',
    isOptional: false,
  },
]

// ============================================================================
// Wizard Data State
// ============================================================================

/**
 * Data input method
 */
export type DataInputMethod = 'upload' | 'paste' | 'sample' | 'manual'

/**
 * Data input state
 */
export interface DataInputState {
  method: DataInputMethod
  rawData: string
  parsedQuotes: QuoteInput[]
  marketData: {
    spot: number
    riskFreeRate: number
    dividendYield: number
    valuationDate: string
    currency: string
  }
  isValid: boolean
  validationErrors: string[]
}

/**
 * Step validation state
 */
export interface StepValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// ============================================================================
// Wizard State
// ============================================================================

/**
 * Complete wizard state
 */
export interface WizardState {
  // Navigation
  currentStep: WizardStep
  completedSteps: WizardStep[]
  stepValidation: Record<WizardStep, StepValidation>
  
  // Data
  dataInput: DataInputState
  surface: SurfaceData | null
  detectionResult: ArbitrageDetectionResult | null
  correctionResponse: CorrectionResponse | null
  
  // Status
  isProcessing: boolean
  processingStep: WizardStep | null
  error: string | null
  
  // History (for undo)
  canUndo: boolean
  canRedo: boolean
}

/**
 * Initial wizard state
 */
export const INITIAL_WIZARD_STATE: WizardState = {
  currentStep: 'data-input',
  completedSteps: [],
  stepValidation: {
    'data-input': { isValid: false, errors: [], warnings: [] },
    'surface-preview': { isValid: false, errors: [], warnings: [] },
    'arbitrage-detection': { isValid: false, errors: [], warnings: [] },
    'correction': { isValid: false, errors: [], warnings: [] },
    'export': { isValid: false, errors: [], warnings: [] },
  },
  dataInput: {
    method: 'upload',
    rawData: '',
    parsedQuotes: [],
    marketData: {
      spot: 100,
      riskFreeRate: 0.05,
      dividendYield: 0.02,
      valuationDate: new Date().toISOString().split('T')[0],
      currency: 'USD',
    },
    isValid: false,
    validationErrors: [],
  },
  surface: null,
  detectionResult: null,
  correctionResponse: null,
  isProcessing: false,
  processingStep: null,
  error: null,
  canUndo: false,
  canRedo: false,
}

// ============================================================================
// Wizard Actions
// ============================================================================

/**
 * Wizard navigation action
 */
export type WizardNavigationAction = 
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; step: WizardStep }
  | { type: 'RESET' }

/**
 * Wizard data action
 */
export type WizardDataAction =
  | { type: 'SET_INPUT_METHOD'; method: DataInputMethod }
  | { type: 'SET_RAW_DATA'; data: string }
  | { type: 'SET_PARSED_QUOTES'; quotes: QuoteInput[] }
  | { type: 'SET_MARKET_DATA'; data: Partial<DataInputState['marketData']> }
  | { type: 'SET_SURFACE'; surface: SurfaceData }
  | { type: 'SET_DETECTION_RESULT'; result: ArbitrageDetectionResult }
  | { type: 'SET_CORRECTION_RESPONSE'; response: CorrectionResponse }
  | { type: 'CLEAR_ERROR' }
