/**
 * Skip Link Component
 * Allows keyboard users to skip directly to main content
 * WCAG 2.1 Success Criterion 2.4.1 (Bypass Blocks)
 */

import React from 'react'

interface SkipLinkProps {
  /** Target element ID to skip to */
  targetId?: string
  /** Custom label for the skip link */
  label?: string
  /** Additional skip links for complex layouts */
  additionalLinks?: Array<{ targetId: string; label: string }>
}

const skipLinkStyles: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  top: 0,
  zIndex: 9999,
  padding: '0.75rem 1.5rem',
  background: '#3b82f6',
  color: 'white',
  fontWeight: 600,
  fontSize: '0.875rem',
  textDecoration: 'none',
  borderRadius: '0 0 0.5rem 0',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  transition: 'all 0.15s ease-in-out',
}

const skipLinkFocusStyles: React.CSSProperties = {
  ...skipLinkStyles,
  left: 0,
  outline: '2px solid #60a5fa',
  outlineOffset: '2px',
}

/**
 * SkipLink component for keyboard accessibility
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <SkipLink targetId="main-content" />
 * 
 * // With custom label
 * <SkipLink targetId="main-content" label="Skip to main content" />
 * 
 * // With additional links
 * <SkipLink 
 *   targetId="main-content"
 *   additionalLinks={[
 *     { targetId: 'navigation', label: 'Skip to navigation' },
 *     { targetId: 'footer', label: 'Skip to footer' }
 *   ]}
 * />
 * ```
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId = 'main-content',
  label = 'Skip to main content',
  additionalLinks = [],
}) => {
  const [focused, setFocused] = React.useState<string | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (target) {
      // Set tabindex to make element focusable if it isn't already
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1')
      }
      target.focus()
      // Scroll into view smoothly
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const allLinks = [{ targetId, label }, ...additionalLinks]

  return (
    <nav role="navigation" aria-label="Skip links" style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      {allLinks.map(({ targetId: id, label: linkLabel }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={(e) => handleClick(e, id)}
          onFocus={() => setFocused(id)}
          onBlur={() => setFocused(null)}
          style={focused === id ? skipLinkFocusStyles : skipLinkStyles}
        >
          {linkLabel}
        </a>
      ))}
    </nav>
  )
}

export default SkipLink
