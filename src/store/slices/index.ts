/**
 * Export all Redux slices
 * 
 * Note: Some action names are duplicated across slices.
 * We use selective exports to avoid conflicts.
 */

// Export reducers
export { surfaceReducer } from './surfaceSlice'
export { arbitrageReducer } from './arbitrageSlice'
export { wizardReducer } from './wizardSlice'
export { uiReducer } from './uiSlice'

// Export surface actions (namespaced)
export {
  setCurrentSurface,
  setCorrectedSurface,
  clearSurfaces,
  setSelectedCell,
  setSelectedSlice,
  updateDisplayConfig as updateSurfaceDisplayConfig,
  updateCameraConfig,
  resetDisplayConfig as resetSurfaceDisplayConfig,
  resetCameraConfig,
  setLoading as setSurfaceLoading,
  setError as setSurfaceError,
  clearError as clearSurfaceError,
} from './surfaceSlice'

// Export arbitrage actions (namespaced)
export {
  setDetectionStatus,
  setDetectionResult as setArbitrageDetectionResult,
  setDetectionError,
  setCorrectionStatus,
  setCorrectionResult,
  setCorrectionError,
  setDualCertificate,
  updateDisplayConfig as updateArbitrageDisplayConfig,
  resetDisplayConfig as resetArbitrageDisplayConfig,
  setSelectedViolation,
  resetArbitrageState,
  clearErrors as clearArbitrageErrors,
} from './arbitrageSlice'

// Export wizard actions (namespaced)
export {
  nextStep,
  prevStep,
  goToStep,
  resetWizard,
  setInputMethod,
  setRawData,
  setParsedQuotes,
  setMarketData,
  setValidationErrors,
  setSurface as setWizardSurface,
  setDetectionResult as setWizardDetectionResult,
  setCorrectionResponse,
  setStepValidation,
  setProcessing,
  setError as setWizardError,
  clearError as clearWizardError,
} from './wizardSlice'

// Export UI actions
export {
  setTheme,
  toggleTheme,
  setSidebarState,
  toggleSidebar,
  toggleFooter,
  openModal,
  closeModal,
  addToast,
  removeToast,
  clearToasts,
  setGlobalLoading,
  startLoading,
  stopLoading,
  setLoadingProgress,
  setIsMobile,
  setIsOnline,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from './uiSlice'
