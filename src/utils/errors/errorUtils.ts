/**
 * Error Utilities
 * Standardized error handling, formatting, and logging
 */

// ============================================================================
// Types
// ============================================================================

export interface AppError {
  /** Unique error code for categorization */
  code: string
  /** Human-readable error message */
  message: string
  /** Error severity level */
  severity: 'error' | 'warning' | 'info'
  /** Original error object if available */
  originalError?: Error | unknown
  /** Additional context for debugging */
  context?: Record<string, unknown>
  /** Stack trace if available */
  stack?: string
  /** Timestamp of when the error occurred */
  timestamp: number
  /** Whether the error is recoverable */
  recoverable: boolean
  /** Suggested recovery action */
  recoveryAction?: string
}

export interface ErrorLogEntry extends AppError {
  /** Component or function where error occurred */
  source: string
  /** User action that triggered the error */
  userAction?: string
}

export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'CALCULATION_ERROR'
  | 'RENDER_ERROR'
  | 'DATA_ERROR'
  | 'API_ERROR'
  | 'UNKNOWN_ERROR'
  | 'TIMEOUT_ERROR'
  | 'PERMISSION_ERROR'
  | 'NOT_FOUND_ERROR'

// ============================================================================
// Error Factory
// ============================================================================

/**
 * Create a standardized AppError object
 */
export function createAppError(
  code: ErrorCode,
  message: string,
  options: {
    severity?: AppError['severity']
    originalError?: Error | unknown
    context?: Record<string, unknown>
    recoverable?: boolean
    recoveryAction?: string
  } = {}
): AppError {
  const {
    severity = 'error',
    originalError,
    context,
    recoverable = false,
    recoveryAction,
  } = options

  return {
    code,
    message,
    severity,
    originalError,
    context,
    stack: originalError instanceof Error ? originalError.stack : undefined,
    timestamp: Date.now(),
    recoverable,
    recoveryAction,
  }
}

// ============================================================================
// Error Parsing
// ============================================================================

/**
 * Parse any error into a standardized AppError
 */
export function parseError(error: unknown): AppError {
  // Already an AppError
  if (isAppError(error)) {
    return error
  }

  // Standard JavaScript Error
  if (error instanceof Error) {
    return createAppError(
      getErrorCodeFromError(error),
      error.message,
      {
        originalError: error,
        recoverable: isRecoverableError(error),
      }
    )
  }

  // API error response
  if (isApiErrorResponse(error)) {
    return createAppError(
      'API_ERROR',
      error.message || 'API request failed',
      {
        originalError: error,
        context: { status: error.status, data: error.data },
        recoverable: error.status >= 500,
        recoveryAction: error.status >= 500 ? 'Please try again later' : undefined,
      }
    )
  }

  // String error
  if (typeof error === 'string') {
    return createAppError('UNKNOWN_ERROR', error, { recoverable: true })
  }

  // Fallback for unknown error types
  return createAppError(
    'UNKNOWN_ERROR',
    'An unexpected error occurred',
    {
      originalError: error,
      context: { errorType: typeof error },
      recoverable: true,
      recoveryAction: 'Please try again or refresh the page',
    }
  )
}

/**
 * Type guard for AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error
  )
}

/**
 * Type guard for API error responses
 */
function isApiErrorResponse(
  error: unknown
): error is { status: number; message?: string; data?: unknown } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as Record<string, unknown>).status === 'number'
  )
}

/**
 * Determine error code from Error instance
 */
function getErrorCodeFromError(error: Error): ErrorCode {
  const message = error.message.toLowerCase()
  const name = error.name.toLowerCase()

  if (message.includes('network') || message.includes('fetch')) {
    return 'NETWORK_ERROR'
  }
  if (message.includes('timeout') || name.includes('timeout')) {
    return 'TIMEOUT_ERROR'
  }
  if (message.includes('validation') || name.includes('validation')) {
    return 'VALIDATION_ERROR'
  }
  if (message.includes('not found') || message.includes('404')) {
    return 'NOT_FOUND_ERROR'
  }
  if (message.includes('permission') || message.includes('forbidden') || message.includes('401') || message.includes('403')) {
    return 'PERMISSION_ERROR'
  }
  if (name.includes('type') || name.includes('reference') || name.includes('syntax')) {
    return 'CALCULATION_ERROR'
  }

  return 'UNKNOWN_ERROR'
}

/**
 * Determine if an error is recoverable
 */
function isRecoverableError(error: Error): boolean {
  const message = error.message.toLowerCase()
  
  // Network errors are usually recoverable
  if (message.includes('network') || message.includes('fetch')) {
    return true
  }
  
  // Timeout errors are recoverable
  if (message.includes('timeout')) {
    return true
  }
  
  // Type/syntax errors are not recoverable without code fix
  if (error.name.includes('Type') || error.name.includes('Syntax')) {
    return false
  }
  
  return true
}

// ============================================================================
// Error Formatting
// ============================================================================

/**
 * Format error for display to users
 */
export function formatErrorForDisplay(error: AppError): {
  title: string
  message: string
  action?: string
} {
  const titles: Record<ErrorCode, string> = {
    NETWORK_ERROR: 'Connection Error',
    VALIDATION_ERROR: 'Invalid Input',
    CALCULATION_ERROR: 'Calculation Error',
    RENDER_ERROR: 'Display Error',
    DATA_ERROR: 'Data Error',
    API_ERROR: 'Server Error',
    UNKNOWN_ERROR: 'Unexpected Error',
    TIMEOUT_ERROR: 'Request Timeout',
    PERMISSION_ERROR: 'Access Denied',
    NOT_FOUND_ERROR: 'Not Found',
  }

  return {
    title: titles[error.code as ErrorCode] || 'Error',
    message: sanitizeErrorMessage(error.message),
    action: error.recoveryAction,
  }
}

/**
 * Sanitize error message for display
 * Removes sensitive information and technical jargon
 */
function sanitizeErrorMessage(message: string): string {
  // Remove file paths
  let sanitized = message.replace(/(?:\/[\w.-]+)+\.\w+/g, '[file]')
  
  // Remove stack trace snippets
  sanitized = sanitized.replace(/at\s+[\w.<>]+\s*\([^)]+\)/g, '')
  
  // Remove memory addresses
  sanitized = sanitized.replace(/0x[\da-f]+/gi, '[address]')
  
  // Trim and clean up whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim()
  
  return sanitized || 'An error occurred'
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: AppError, source: string): ErrorLogEntry {
  return {
    ...error,
    source,
  }
}

// ============================================================================
// Error Logging
// ============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  minLevel: LogLevel
  enableConsole: boolean
  enableRemote: boolean
  remoteEndpoint?: string
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

let loggerConfig: LoggerConfig = {
  minLevel: 'warn',
  enableConsole: true,
  enableRemote: false,
}

const errorLog: ErrorLogEntry[] = []
const MAX_LOG_ENTRIES = 100

/**
 * Configure the error logger
 */
export function configureErrorLogger(config: Partial<LoggerConfig>): void {
  loggerConfig = { ...loggerConfig, ...config }
}

/**
 * Log an error
 */
export function logError(
  error: AppError | Error | unknown,
  source: string,
  userAction?: string
): void {
  const appError = isAppError(error) ? error : parseError(error)
  const entry = formatErrorForLogging(appError, source)
  if (userAction) {
    entry.userAction = userAction
  }

  // Add to in-memory log
  errorLog.push(entry)
  if (errorLog.length > MAX_LOG_ENTRIES) {
    errorLog.shift()
  }

  // Console logging
  if (loggerConfig.enableConsole) {
    const level = appError.severity === 'error' ? 'error' : appError.severity === 'warning' ? 'warn' : 'info'
    if (LOG_LEVELS[level] >= LOG_LEVELS[loggerConfig.minLevel]) {
      console[level](`[${source}] ${appError.code}: ${appError.message}`, {
        context: appError.context,
        timestamp: new Date(appError.timestamp).toISOString(),
      })
    }
  }

  // Remote logging (placeholder for future implementation)
  if (loggerConfig.enableRemote && loggerConfig.remoteEndpoint) {
    // Could implement remote logging here
    // fetch(loggerConfig.remoteEndpoint, { method: 'POST', body: JSON.stringify(entry) })
  }
}

/**
 * Get recent error logs
 */
export function getErrorLog(): readonly ErrorLogEntry[] {
  return [...errorLog]
}

/**
 * Clear error log
 */
export function clearErrorLog(): void {
  errorLog.length = 0
}

// ============================================================================
// Error Retry Logic
// ============================================================================

interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
}

/**
 * Execute a function with automatic retry on failure
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs, backoffMultiplier } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  }

  let lastError: Error | unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Check if error is recoverable
      const appError = parseError(error)
      if (!appError.recoverable) {
        throw error
      }

      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        const delay = Math.min(
          baseDelayMs * Math.pow(backoffMultiplier, attempt),
          maxDelayMs
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// ============================================================================
// Async Error Wrapper
// ============================================================================

/**
 * Wrap an async function to catch and handle errors
 */
export function wrapAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: {
    source: string
    onError?: (error: AppError) => void
    rethrow?: boolean
  }
): T {
  const { source, onError, rethrow = true } = options

  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      const appError = parseError(error)
      logError(appError, source)
      onError?.(appError)
      if (rethrow) {
        throw appError
      }
    }
  }) as T
}
