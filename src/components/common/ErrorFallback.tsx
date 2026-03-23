import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ErrorFallbackProps {
  error: Error | null
  onReset?: () => void
  title?: string
  message?: string
}

/**
 * Fallback UI when an error occurs
 */
export function ErrorFallback({
  error,
  onReset,
  title = 'Something went wrong',
  message,
}: ErrorFallbackProps) {
  const errorMessage = message || error?.message || 'An unexpected error occurred'

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-500/10 mb-6">
        <AlertTriangle className="h-8 w-8 text-error-500" />
      </div>

      <h2 className="text-2xl font-semibold text-surface-100 mb-2">{title}</h2>
      <p className="text-surface-400 text-center max-w-md mb-6">{errorMessage}</p>

      {/* Error details in development */}
      {import.meta.env.DEV && error && (
        <pre className="mb-6 max-w-full overflow-auto rounded-lg bg-surface-800 p-4 text-sm text-surface-400">
          <code>{error.stack}</code>
        </pre>
      )}

      <div className="flex gap-4">
        {onReset && (
          <button
            onClick={onReset}
            className="btn-primary px-4 py-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        )}
        <Link to="/" className="btn-secondary px-4 py-2">
          <Home className="h-4 w-4 mr-2" />
          Go Home
        </Link>
      </div>
    </div>
  )
}
