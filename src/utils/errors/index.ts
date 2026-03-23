/**
 * Error Utilities - Barrel Export
 */

export {
  // Types
  type AppError,
  type ErrorLogEntry,
  type ErrorCode,
  
  // Error factory and parsing
  createAppError,
  parseError,
  isAppError,
  
  // Error formatting
  formatErrorForDisplay,
  formatErrorForLogging,
  
  // Logging
  configureErrorLogger,
  logError,
  getErrorLog,
  clearErrorLog,
  
  // Retry logic
  withRetry,
  
  // Async wrapper
  wrapAsync,
} from './errorUtils'
