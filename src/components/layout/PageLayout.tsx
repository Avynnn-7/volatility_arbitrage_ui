import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface PageLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  className?: string
  fullWidth?: boolean
  noPadding?: boolean
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export function PageLayout({
  children,
  title,
  description,
  className,
  fullWidth = false,
  noPadding = false,
}: PageLayoutProps) {
  return (
    <motion.main
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex-1',
        !noPadding && 'p-6',
        !fullWidth && 'max-w-7xl mx-auto w-full',
        className
      )}
    >
      {(title || description) && (
        <header className="mb-8">
          {title && (
            <h1 className="text-3xl font-bold text-surface-50">{title}</h1>
          )}
          {description && (
            <p className="mt-2 text-surface-400">{description}</p>
          )}
        </header>
      )}
      {children}
    </motion.main>
  )
}
