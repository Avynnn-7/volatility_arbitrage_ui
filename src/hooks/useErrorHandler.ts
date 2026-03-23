/**
 * useErrorHandler Hook
 * Provides error handling capabilities for functional components
 */

import { useCallback, useState, useEffect, useRef } from 'react'
import type { AppError } from '../utils/errors'
import { 
  parseError, 
  logError, 
  formatErrorForDisplay,
  withRetry,
  createAppError,
} from '../utils/errors'

// ============================================================================
// Types
// ============================================================================

interface UseErrorHandlerOptions {
  /** Component/source name for logging */
  source?: string
  /** Whether to rethrow errors after handling */
  rethrow?: boolean
  /** Default error handler callback */
  onError?: (error: AppError) => void
  /** Whether to automatically clear errors after timeout */
  autoClear?: boolean
  /** Auto-clear timeout in ms */
  autoClearTimeout?: number
}

interface UseErrorHandlerReturn {
  /** Current error state */
  error: AppError | null
  /** Whether an error is present */
  hasError: boolean
  /** Formatted error for display */
  displayError: { title: string; message: string; action?: string } | null
  /** Handle an error */
  handleError: (error: unknown, context?: string) => void
  /** Clear the current error */
  clearError: () => void
  /** Reset error state and try again */
  resetAndRetry: (retryFn?: () => void) => void
  /** Wrap an async function with error handling */
  withErrorHandling: <T>(fn: () => Promise<T>, context?: string) => Promise<T | undefined>
  /** Wrap an async function with retry logic */
  withRetryHandling: <T>(
    fn: () => Promise<T>,
    options?: { maxRetries?: number; context?: string }
  ) => Promise<T | undefined>
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for handling errors in functional components
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { 
 *     error, 
 *     hasError, 
 *     displayError, 
 *     handleError, 
 *     clearError,
 *     withErrorHandling 
 *   } = useErrorHandler({ source: 'MyComponent' })
 * 
 *   const fetchData = async () => {
 *     await withErrorHandling(async () => {
 *       const data = await api.getData()
 *       setData(data)
 *     }, 'fetchData')
 *   }
 * 
 *   if (hasError) {
 *     return (
 *       <div>
 *         <p>{displayError?.message}</p>
 *         <button onClick={clearError}>Dismiss</button>
 *       </div>
 *     )
 *   }
 * 
 *   return <div>...</div>
 * }
 * ```
 */
export function useErrorHandler(
  options: UseErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  const {
    source = 'Component',
    rethrow = false,
    onError,
    autoClear = false,
    autoClearTimeout = 5000,
  } = options

  const [error, setError] = useState<AppError | null>(null)
  const retryRef = useRef<(() => void) | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Auto-clear effect
  useEffect(() => {
    if (error && autoClear) {
      timeoutRef.current = setTimeout(() => {
        setError(null)
      }, autoClearTimeout)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }
  }, [error, autoClear, autoClearTimeout])

  /**
   * Handle an error
   */
  const handleError = useCallback(
    (err: unknown, context?: string) => {
      const appError = parseError(err)
      
      // Add context if provided
      if (context) {
        appError.context = {
          ...appError.context,
          action: context,
        }
      }

      // Log the error
      logError(appError, source, context)

      // Update state
      setError(appError)

      // Call error callback
      onError?.(appError)

      // Rethrow if configured
      if (rethrow) {
        throw appError
      }
    },
    [source, onError, rethrow]
  )

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  /**
   * Reset error and optionally retry
   */
  const resetAndRetry = useCallback(
    (retryFn?: () => void) => {
      clearError()
      const fn = retryFn || retryRef.current
      if (fn) {
        // Small delay to ensure state is cleared
        setTimeout(fn, 0)
      }
    },
    [clearError]
  )

  /**
   * Wrap an async function with error handling
   */
  const withErrorHandling = useCallback(
    async <T,>(fn: () => Promise<T>, context?: string): Promise<T | undefined> => {
      // Store for potential retry
      retryRef.current = () => withErrorHandling(fn, context)
      
      try {
        clearError()
        return await fn()
      } catch (err) {
        handleError(err, context)
        return undefined
      }
    },
    [handleError, clearError]
  )

  /**
   * Wrap an async function with retry logic
   */
  const withRetryHandling = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      retryOptions?: { maxRetries?: number; context?: string }
    ): Promise<T | undefined> => {
      const { maxRetries = 3, context } = retryOptions || {}
      
      try {
        clearError()
        return await withRetry(fn, { maxRetries })
      } catch (err) {
        handleError(err, context)
        return undefined
      }
    },
    [handleError, clearError]
  )

  // Compute display error
  const displayError = error ? formatErrorForDisplay(error) : null

  return {
    error,
    hasError: error !== null,
    displayError,
    handleError,
    clearError,
    resetAndRetry,
    withErrorHandling,
    withRetryHandling,
  }
}

// ============================================================================
// Additional Error Hooks
// ============================================================================

/**
 * Hook for handling async operations with loading and error states
 */
export function useAsyncError<T>(
  asyncFn: () => Promise<T>,
  options: UseErrorHandlerOptions & { 
    immediate?: boolean
    deps?: unknown[]
  } = {}
) {
  const { immediate = false, deps = [], ...errorOptions } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const errorHandler = useErrorHandler(errorOptions)

  const execute = useCallback(async () => {
    setIsLoading(true)
    const result = await errorHandler.withErrorHandling(asyncFn)
    if (result !== undefined) {
      setData(result)
    }
    setIsLoading(false)
    return result
  }, [asyncFn, errorHandler])

  useEffect(() => {
    if (immediate) {
      execute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return {
    data,
    isLoading,
    execute,
    ...errorHandler,
  }
}

/**
 * Hook for throwing errors to the nearest ErrorBoundary
 */
export function useErrorBoundary() {
  const [, setError] = useState<Error>()

  const throwError = useCallback((error: unknown) => {
    setError(() => {
      if (error instanceof Error) {
        throw error
      }
      const appError = parseError(error)
      throw new Error(appError.message)
    })
  }, [])

  return throwError
}

/**
 * Hook for creating domain-specific error handlers
 */
export function useTypedErrorHandler<T extends string>(
  errorMap: Record<T, { message: string; recoverable?: boolean; action?: string }>,
  options: UseErrorHandlerOptions = {}
) {
  const errorHandler = useErrorHandler(options)

  const handleTypedError = useCallback(
    (errorType: T, context?: Record<string, unknown>) => {
      const errorDef = errorMap[errorType]
      const appError = createAppError(
        'VALIDATION_ERROR',
        errorDef.message,
        {
          recoverable: errorDef.recoverable ?? true,
          recoveryAction: errorDef.action,
          context,
        }
      )
      errorHandler.handleError(appError)
    },
    [errorMap, errorHandler]
  )

  return {
    ...errorHandler,
    handleTypedError,
  }
}

export default useErrorHandler
