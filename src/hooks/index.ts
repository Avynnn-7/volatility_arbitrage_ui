/**
 * Central export for all custom hooks
 */

// Core hooks
export { useTheme } from './useTheme'
export { useLocalStorage } from './useLocalStorage'

// API hooks
export { useApiStatus } from './useApiStatus'

// Domain hooks
export { useVolSurface } from './useVolSurface'
export { useArbitrageDetection } from './useArbitrageDetection'
export { useQPCorrection } from './useQPCorrection'
export { useLocalVolatility, useVolatilityComparison } from './useLocalVolatility'

// PDF generation hooks
export { 
  usePDFGeneration, 
  useBuildReport,
  generateReportId,
  formatReportFilename,
} from './usePDFGeneration'

// Error handling hooks
export { 
  useErrorHandler,
  useAsyncError,
  useErrorBoundary,
  useTypedErrorHandler,
} from './useErrorHandler'

// Redux hooks (re-export)
export { useAppDispatch, useAppSelector } from '@/store/hooks'
