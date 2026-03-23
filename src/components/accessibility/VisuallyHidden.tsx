/**
 * Visually Hidden Component
 * Hides content visually while keeping it accessible to screen readers
 * WCAG 2.1 Success Criterion 1.3.1 (Info and Relationships)
 */

import React from 'react'

interface VisuallyHiddenProps {
  /** Content to be hidden visually but accessible to screen readers */
  children: React.ReactNode
  /** Element type to render */
  as?: keyof JSX.IntrinsicElements
  /** Whether to show content when focused (useful for skip links) */
  focusable?: boolean
  /** ID for ARIA labeling relationships */
  id?: string
  /** Additional class name */
  className?: string
}

const hiddenStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

/**
 * VisuallyHidden component for screen reader only content
 * 
 * @example
 * ```tsx
 * // Basic usage - hidden text for screen readers
 * <button>
 *   <Icon name="close" />
 *   <VisuallyHidden>Close dialog</VisuallyHidden>
 * </button>
 * 
 * // As a label
 * <VisuallyHidden as="label" id="search-label">
 *   Search
 * </VisuallyHidden>
 * <input aria-labelledby="search-label" type="search" />
 * 
 * // Focusable (shows on focus)
 * <VisuallyHidden focusable>
 *   <a href="#main">Skip to main content</a>
 * </VisuallyHidden>
 * ```
 */
export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({
  children,
  as: Component = 'span',
  focusable = false,
  id,
  className,
}) => {
  const [isFocused, setIsFocused] = React.useState(false)

  const styles: React.CSSProperties = 
    focusable && isFocused
      ? {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: '0.5rem 1rem',
          margin: 0,
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
        }
      : hiddenStyles

  const Comp = Component as React.ElementType
  return (
    <Comp
      id={id}
      className={className}
      style={styles}
      onFocus={() => focusable && setIsFocused(true)}
      onBlur={() => focusable && setIsFocused(false)}
    >
      {children}
    </Comp>
  )
}

/**
 * CSS class for visually hidden content
 * Can be used directly in CSS or added as a className
 */
export const visuallyHiddenClass = 'sr-only'

/**
 * CSS styles object for visually hidden content
 */
export const visuallyHiddenStyles = hiddenStyles
