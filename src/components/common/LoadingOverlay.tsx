import { motion, AnimatePresence } from 'framer-motion'
import { Spinner } from './Spinner'
import { cn } from '@/utils/cn'

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  progress?: number
  fullScreen?: boolean
}

/**
 * Loading overlay with optional progress
 */
export function LoadingOverlay({
  isLoading,
  message,
  progress,
  fullScreen = false,
}: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'flex flex-col items-center justify-center bg-surface-900/80 backdrop-blur-sm z-50',
            fullScreen ? 'fixed inset-0' : 'absolute inset-0'
          )}
        >
          <Spinner size="xl" />
          
          {message && (
            <p className="mt-4 text-surface-300 text-sm">{message}</p>
          )}
          
          {progress !== undefined && (
            <div className="mt-4 w-48">
              <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="mt-1 text-center text-xs text-surface-500">
                {Math.round(progress)}%
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
