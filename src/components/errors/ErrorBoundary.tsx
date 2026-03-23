/**
 * Error Boundary Component
 * React error boundary with customizable fallback UI
 * Catches JavaScript errors anywhere in the child component tree
 */

import React, { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import type { AppError } from '../../utils/errors'
import { createAppError, logError, formatErrorForDisplay } from '../../utils/errors'

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode
  /** Custom fallback UI component */
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode)
  /** Called when an error is caught */
  onError?: (error: AppError, errorInfo: ErrorInfo) => void
  /** Called when reset is triggered */
  onReset?: () => void
  /** Reset keys - boundary resets when these change */
  resetKeys?: unknown[]
  /** Identifier for error logging */
  name?: string
  /** Whether to show a minimal error UI */
  minimal?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: AppError | null
  errorInfo: ErrorInfo | null
}

export interface ErrorFallbackProps {
  error: AppError
  errorInfo: ErrorInfo | null
  resetErrorBoundary: () => void
}

// ============================================================================
// Default Fallback Component
// ============================================================================

const DefaultErrorFallback: React.FC<ErrorFallbackProps & { minimal?: boolean }> = ({
  error,
  errorInfo,
  resetErrorBoundary,
  minimal = false,
}) => {
  const { title, message, action } = formatErrorForDisplay(error)

  if (minimal) {
    return (
      <div role="alert" className="p-4 bg-red-100 border border-red-300 rounded-md text-sm text-red-800">
        <strong>{title}:</strong> {message}
        {action && <span> {action}</span>}
        <button
          onClick={resetErrorBoundary}
          className="ml-2 underline bg-transparent border-none cursor-pointer text-inherit"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div role="alert" aria-live="assertive" className="flex flex-col items-center justify-center p-8 min-h-[200px] bg-gradient-to-br from-red-100 to-red-200 border border-red-300 rounded-lg text-center">
      <div aria-hidden="true" className="w-16 h-16 mb-4 flex items-center justify-center bg-red-500 rounded-full text-white text-3xl">!</div>
      <h2 className="m-0 mb-2 text-xl font-semibold text-red-800">{title}</h2>
      <p className="m-0 mb-4 text-sm text-red-700 max-w-[400px]">{message}</p>
      <code className="inline-block px-2 py-1 mb-4 bg-black/10 rounded text-xs text-red-900">{error.code}</code>
      
      {action && <p className="m-0 mb-4 text-sm text-red-700 max-w-[400px]">{action}</p>}
      
      <div className="flex gap-2">
        <button className="px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-all bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2" onClick={resetErrorBoundary}>
          Try Again
        </button>
        <button className="px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-all bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2" onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && error.stack && (
        <details className="mt-4 text-left w-full max-w-[500px]">
          <summary className="cursor-pointer text-xs text-red-900 hover:underline">Show technical details</summary>
          <pre className="mt-2 p-3 bg-black/5 rounded text-[10px] text-red-900 overflow-x-auto text-left whitespace-pre-wrap break-words max-h-[200px]">{error.stack}</pre>
          {errorInfo?.componentStack && (
            <pre className="mt-2 p-3 bg-black/5 rounded text-[10px] text-red-900 overflow-x-auto text-left whitespace-pre-wrap break-words max-h-[200px]">{errorInfo.componentStack}</pre>
          )}
        </details>
      )}
    </div>
  )
}

// ============================================================================
// Error Boundary Class Component
// ============================================================================

/**
 * ErrorBoundary component for catching and displaying errors
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * // With custom fallback
 * <ErrorBoundary fallback={<CustomError />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * // With render prop fallback
 * <ErrorBoundary 
 *   fallback={({ error, resetErrorBoundary }) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={resetErrorBoundary}>Retry</button>
 *     </div>
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * // With error callback
 * <ErrorBoundary 
 *   onError={(error) => sendToErrorTracking(error)}
 *   name="ChartSection"
 * >
 *   <Chart />
 * </ErrorBoundary>
 * 
 * // With reset keys (resets when keys change)
 * <ErrorBoundary resetKeys={[userId, chartType]}>
 *   <Chart />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const appError = createAppError('RENDER_ERROR', error.message, {
      originalError: error,
      recoverable: true,
      recoveryAction: 'Try refreshing the component or reloading the page',
    })

    return {
      hasError: true,
      error: appError,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, name = 'ErrorBoundary' } = this.props
    
    const appError = createAppError('RENDER_ERROR', error.message, {
      originalError: error,
      context: {
        componentStack: errorInfo.componentStack,
      },
      recoverable: true,
    })

    // Log the error
    logError(appError, name)

    // Update state with error info
    this.setState({ errorInfo })

    // Call error callback if provided
    onError?.(appError, errorInfo)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props
    const { hasError } = this.state

    // Reset error state if resetKeys changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasChangedKeys = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      )
      if (hasChangedKeys) {
        this.resetErrorBoundary()
      }
    }
  }

  resetErrorBoundary = (): void => {
    const { onReset } = this.props
    onReset?.()
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    const { children, fallback, minimal } = this.props
    const { hasError, error, errorInfo } = this.state

    if (hasError && error) {
      // Custom fallback component
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback({
            error,
            errorInfo,
            resetErrorBoundary: this.resetErrorBoundary,
          })
        }
        return fallback
      }

      // Default fallback
      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetErrorBoundary={this.resetErrorBoundary}
          minimal={minimal}
        />
      )
    }

    return children
  }
}

export default ErrorBoundary
