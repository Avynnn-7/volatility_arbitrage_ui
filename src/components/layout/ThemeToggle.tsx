import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/utils/cn'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative flex h-9 w-16 items-center rounded-full p-1 transition-colors duration-300',
        isDark ? 'bg-surface-700' : 'bg-primary-100'
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Icons */}
      <Sun
        className={cn(
          'absolute left-2 h-4 w-4 transition-opacity duration-300',
          isDark ? 'opacity-50 text-surface-400' : 'opacity-100 text-primary-600'
        )}
      />
      <Moon
        className={cn(
          'absolute right-2 h-4 w-4 transition-opacity duration-300',
          isDark ? 'opacity-100 text-primary-400' : 'opacity-50 text-surface-400'
        )}
      />

      {/* Toggle indicator */}
      <span
        className={cn(
          'absolute h-7 w-7 rounded-full bg-white shadow-md transition-all duration-300',
          isDark ? 'left-8' : 'left-1'
        )}
      />
    </button>
  )
}
