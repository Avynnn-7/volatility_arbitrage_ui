/**
 * Accessibility Utilities
 * Hooks and utilities for WCAG 2.1 AA compliance
 */

import { useCallback, useEffect, useRef, useState } from 'react'

// ============================================================================
// Focus Management
// ============================================================================

/**
 * Hook for managing focus trap within a container
 * Useful for modals, dialogs, and dropdown menus
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = getFocusableElements(container)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement

    // Focus first element
    firstElement?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab: go backwards
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab: go forwards
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      // Restore focus when trap is deactivated
      previouslyFocused?.focus()
    }
  }, [isActive])

  return containerRef
}

/**
 * Hook for restoring focus after an action
 */
export function useFocusReturn() {
  const returnRef = useRef<HTMLElement | null>(null)

  const saveFocus = useCallback(() => {
    returnRef.current = document.activeElement as HTMLElement
  }, [])

  const restoreFocus = useCallback(() => {
    returnRef.current?.focus()
    returnRef.current = null
  }, [])

  return { saveFocus, restoreFocus }
}

/**
 * Hook for managing focus on mount
 */
export function useFocusOnMount<T extends HTMLElement>(shouldFocus: boolean = true) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (shouldFocus && ref.current) {
      ref.current.focus()
    }
  }, [shouldFocus])

  return ref
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ')

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

/**
 * Hook for arrow key navigation in lists
 */
export function useArrowNavigation<T extends HTMLElement>(
  items: T[] | null,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both'
    loop?: boolean
    onSelect?: (index: number) => void
  } = {}
) {
  const { orientation = 'vertical', loop = true, onSelect } = options
  const [activeIndex, setActiveIndex] = useState(0)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!items || items.length === 0) return

      const isVertical = orientation === 'vertical' || orientation === 'both'
      const isHorizontal = orientation === 'horizontal' || orientation === 'both'

      let newIndex = activeIndex

      switch (e.key) {
        case 'ArrowUp':
          if (isVertical) {
            e.preventDefault()
            newIndex = activeIndex - 1
          }
          break
        case 'ArrowDown':
          if (isVertical) {
            e.preventDefault()
            newIndex = activeIndex + 1
          }
          break
        case 'ArrowLeft':
          if (isHorizontal) {
            e.preventDefault()
            newIndex = activeIndex - 1
          }
          break
        case 'ArrowRight':
          if (isHorizontal) {
            e.preventDefault()
            newIndex = activeIndex + 1
          }
          break
        case 'Home':
          e.preventDefault()
          newIndex = 0
          break
        case 'End':
          e.preventDefault()
          newIndex = items.length - 1
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          onSelect?.(activeIndex)
          return
        default:
          return
      }

      // Handle looping
      if (loop) {
        if (newIndex < 0) newIndex = items.length - 1
        if (newIndex >= items.length) newIndex = 0
      } else {
        newIndex = Math.max(0, Math.min(items.length - 1, newIndex))
      }

      setActiveIndex(newIndex)
      items[newIndex]?.focus()
    },
    [items, activeIndex, orientation, loop, onSelect]
  )

  return { activeIndex, setActiveIndex, handleKeyDown }
}

/**
 * Hook for escape key handling
 */
export function useEscapeKey(callback: () => void, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [callback, isActive])
}

// ============================================================================
// Screen Reader Utilities
// ============================================================================

/**
 * Hook for announcing messages to screen readers
 */
export function useAnnounce() {
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const announcement = document.createElement('div')
      announcement.setAttribute('role', 'status')
      announcement.setAttribute('aria-live', priority)
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = message

      document.body.appendChild(announcement)

      // Remove after announcement is made
      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)
    },
    []
  )

  return announce
}

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0
export function useId(prefix: string = 'id'): string {
  const [id] = useState(() => `${prefix}-${++idCounter}`)
  return id
}

/**
 * Hook for managing aria-describedby relationships
 */
export function useAriaDescribedBy(descriptions: string[]) {
  const ids = descriptions.map((_, i) => useId(`desc-${i}`))
  const describedBy = ids.join(' ')
  
  return {
    describedBy,
    descriptions: descriptions.map((text, i) => ({ id: ids[i], text })),
  }
}

// ============================================================================
// Reduced Motion
// ============================================================================

/**
 * Hook for respecting user's reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return reducedMotion
}

// ============================================================================
// Color Contrast
// ============================================================================

/**
 * Check if a color combination meets WCAG contrast requirements
 */
export function checkContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): { passes: boolean; ratio: number } {
  const fgLuminance = getLuminance(foreground)
  const bgLuminance = getLuminance(background)
  
  const lighter = Math.max(fgLuminance, bgLuminance)
  const darker = Math.min(fgLuminance, bgLuminance)
  
  const ratio = (lighter + 0.05) / (darker + 0.05)
  
  const threshold = level === 'AAA' ? 7 : 4.5
  
  return { passes: ratio >= threshold, ratio }
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  
  const [r, g, b] = rgb.map((c) => {
    const sRGB = c / 255
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Convert hex color to RGB array
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null
}

// ============================================================================
// ARIA Helpers
// ============================================================================

/**
 * Generate ARIA props for expandable elements
 */
export function getExpandableProps(
  isExpanded: boolean,
  controlsId: string
) {
  return {
    'aria-expanded': isExpanded,
    'aria-controls': controlsId,
  }
}

/**
 * Generate ARIA props for selected elements in a list
 */
export function getSelectableProps(
  isSelected: boolean,
  index: number,
  total: number
) {
  return {
    'aria-selected': isSelected,
    'aria-posinset': index + 1,
    'aria-setsize': total,
  }
}

/**
 * Generate ARIA props for loading states
 */
export function getLoadingProps(isLoading: boolean, loadingText?: string) {
  return {
    'aria-busy': isLoading,
    'aria-describedby': isLoading ? 'loading-indicator' : undefined,
    ...(isLoading && loadingText ? { 'aria-label': loadingText } : {}),
  }
}
