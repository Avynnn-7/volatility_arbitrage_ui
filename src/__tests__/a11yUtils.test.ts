/**
 * Accessibility Utilities Tests
 * Tests for a11y hooks and utilities
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useFocusReturn,
  getFocusableElements,
  useArrowNavigation,
  useEscapeKey,
  useReducedMotion,
  checkContrast,
  getExpandableProps,
  getSelectableProps,
  getLoadingProps,
} from '@/utils/accessibility'

describe('Accessibility Utilities', () => {
  describe('getFocusableElements', () => {
    it('should find focusable elements', () => {
      const container = document.createElement('div')
      container.innerHTML = `
        <button>Button</button>
        <a href="#">Link</a>
        <input type="text" />
        <select><option>Option</option></select>
        <textarea></textarea>
        <div tabindex="0">Focusable div</div>
        <div tabindex="-1">Not focusable</div>
        <button disabled>Disabled button</button>
      `

      const focusable = getFocusableElements(container)

      expect(focusable.length).toBe(6)
      expect(focusable[0].tagName).toBe('BUTTON')
      expect(focusable[1].tagName).toBe('A')
    })

    it('should return empty array for container with no focusable elements', () => {
      const container = document.createElement('div')
      container.innerHTML = `
        <div>Not focusable</div>
        <span>Also not focusable</span>
      `

      const focusable = getFocusableElements(container)

      expect(focusable).toEqual([])
    })
  })

  describe('useEscapeKey', () => {
    it('should call callback on Escape key press', () => {
      const callback = vi.fn()

      renderHook(() => useEscapeKey(callback, true))

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      })

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should not call callback when inactive', () => {
      const callback = vi.fn()

      renderHook(() => useEscapeKey(callback, false))

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      })

      expect(callback).not.toHaveBeenCalled()
    })

    it('should not call callback for other keys', () => {
      const callback = vi.fn()

      renderHook(() => useEscapeKey(callback, true))

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      })

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('useReducedMotion', () => {
    it('should return false by default', () => {
      const { result } = renderHook(() => useReducedMotion())

      expect(result.current).toBe(false)
    })
  })

  describe('useFocusReturn', () => {
    it('should save and restore focus', () => {
      const button = document.createElement('button')
      document.body.appendChild(button)
      button.focus()

      const { result } = renderHook(() => useFocusReturn())

      // Save current focus
      act(() => {
        result.current.saveFocus()
      })

      // Focus something else
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      expect(document.activeElement).toBe(input)

      // Restore focus
      act(() => {
        result.current.restoreFocus()
      })

      expect(document.activeElement).toBe(button)

      // Cleanup
      document.body.removeChild(button)
      document.body.removeChild(input)
    })
  })

  describe('checkContrast', () => {
    it('should pass for high contrast colors', () => {
      const result = checkContrast('#000000', '#ffffff')

      expect(result.passes).toBe(true)
      expect(result.ratio).toBeGreaterThan(4.5)
    })

    it('should fail for low contrast colors', () => {
      const result = checkContrast('#777777', '#888888')

      expect(result.passes).toBe(false)
      expect(result.ratio).toBeLessThan(4.5)
    })

    it('should handle AAA level requirement', () => {
      // This passes AA but might not pass AAA
      const result = checkContrast('#595959', '#ffffff', 'AAA')

      // 7:1 is required for AAA
      expect(result.ratio).toBeDefined()
    })
  })

  describe('ARIA Helper Functions', () => {
    describe('getExpandableProps', () => {
      it('should return correct props when expanded', () => {
        const props = getExpandableProps(true, 'content-1')

        expect(props['aria-expanded']).toBe(true)
        expect(props['aria-controls']).toBe('content-1')
      })

      it('should return correct props when collapsed', () => {
        const props = getExpandableProps(false, 'content-2')

        expect(props['aria-expanded']).toBe(false)
        expect(props['aria-controls']).toBe('content-2')
      })
    })

    describe('getSelectableProps', () => {
      it('should return correct props for selected item', () => {
        const props = getSelectableProps(true, 2, 10)

        expect(props['aria-selected']).toBe(true)
        expect(props['aria-posinset']).toBe(3) // 1-indexed
        expect(props['aria-setsize']).toBe(10)
      })

      it('should return correct props for unselected item', () => {
        const props = getSelectableProps(false, 0, 5)

        expect(props['aria-selected']).toBe(false)
        expect(props['aria-posinset']).toBe(1)
        expect(props['aria-setsize']).toBe(5)
      })
    })

    describe('getLoadingProps', () => {
      it('should return busy state when loading', () => {
        const props = getLoadingProps(true, 'Loading data...')

        expect(props['aria-busy']).toBe(true)
        expect(props['aria-describedby']).toBe('loading-indicator')
        expect(props['aria-label']).toBe('Loading data...')
      })

      it('should return non-busy state when not loading', () => {
        const props = getLoadingProps(false)

        expect(props['aria-busy']).toBe(false)
        expect(props['aria-describedby']).toBeUndefined()
      })
    })
  })

  describe('useArrowNavigation', () => {
    it('should handle arrow key navigation', () => {
      const items = [
        document.createElement('button'),
        document.createElement('button'),
        document.createElement('button'),
      ]
      items.forEach((item, i) => {
        item.textContent = `Item ${i}`
        item.focus = vi.fn()
      })

      const { result } = renderHook(() =>
        useArrowNavigation(items, { orientation: 'vertical' })
      )

      expect(result.current.activeIndex).toBe(0)

      // Simulate ArrowDown
      act(() => {
        const event = {
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent
        result.current.handleKeyDown(event)
      })

      expect(result.current.activeIndex).toBe(1)
      expect(items[1].focus).toHaveBeenCalled()
    })

    it('should loop when reaching boundaries', () => {
      const items = [
        document.createElement('button'),
        document.createElement('button'),
      ]
      items.forEach((item) => {
        item.focus = vi.fn()
      })

      const { result } = renderHook(() =>
        useArrowNavigation(items, { orientation: 'vertical', loop: true })
      )

      // Go to last item
      act(() => {
        result.current.setActiveIndex(1)
      })

      // Press down should loop to first
      act(() => {
        const event = {
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent
        result.current.handleKeyDown(event)
      })

      expect(result.current.activeIndex).toBe(0)
    })
  })
})
