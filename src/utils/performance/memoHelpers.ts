/**
 * Memoization Helpers
 * Utility functions and hooks for React performance optimization
 */

import { memo, useCallback, useRef, useEffect, useState } from 'react'
import type { ComponentType, DependencyList } from 'react'

// ============================================================================
// Enhanced Memo
// ============================================================================

/**
 * Enhanced memo with custom comparison function
 * Defaults to shallow equality check
 */
export function deepMemo<P extends object>(
  Component: ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
) {
  return memo(Component, propsAreEqual ?? shallowEqual)
}

// ============================================================================
// Equality Checks
// ============================================================================

/**
 * Shallow equality check for props
 * Compares top-level property references
 */
export function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (a === b) return true
  if (!a || !b) return false

  const keysA = Object.keys(a) as (keyof T)[]
  const keysB = Object.keys(b) as (keyof T)[]

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (a[key] !== b[key]) return false
  }

  return true
}

/**
 * Deep equality check for complex nested objects
 * Use sparingly - shallow checks are preferred for performance
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true

  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b

  if (typeof a !== 'object') return a === b

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false

  const keysA = Object.keys(a as object)
  const keysB = Object.keys(b as object)

  if (keysA.length !== keysB.length) return false

  return keysA.every((key) =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key]
    )
  )
}

// ============================================================================
// Memoization Hooks
// ============================================================================

/**
 * Hook that returns a memoized value only when deep equality changes
 * Useful for objects/arrays that are recreated but have same content
 */
export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<{ deps: DependencyList; value: T }>()

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() }
  }

  return ref.current.value
}

/**
 * Hook that returns a stable callback reference
 * The callback always has access to the latest closure
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args)
  }, []) as T
}

// ============================================================================
// Debounce & Throttle Hooks
// ============================================================================

/**
 * Hook for debounced value
 * Value only updates after delay ms of no changes
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for debounced callback
 * Callback only fires after delay ms of no calls
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeout = useRef<ReturnType<typeof setTimeout>>()
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeout.current) clearTimeout(timeout.current)
      timeout.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  ) as T
}

/**
 * Hook for throttled callback
 * Callback fires at most once per delay ms
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0)
  const timeout = useRef<ReturnType<typeof setTimeout>>()
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const remaining = delay - (now - lastCall.current)

      if (remaining <= 0) {
        lastCall.current = now
        callbackRef.current(...args)
      } else {
        if (timeout.current) clearTimeout(timeout.current)
        timeout.current = setTimeout(() => {
          lastCall.current = Date.now()
          callbackRef.current(...args)
        }, remaining)
      }
    },
    [delay]
  ) as T
}

// ============================================================================
// Props Comparison Utilities
// ============================================================================

/**
 * Props comparison for components with array items
 * Checks array length and reference, then shallow compares other props
 */
export function arrayPropsEqual<P extends { items: unknown[] }>(
  prevProps: P,
  nextProps: P
): boolean {
  if (prevProps.items === nextProps.items) return true
  if (prevProps.items.length !== nextProps.items.length) return false

  // Compare other props
  const prevRest = { ...prevProps, items: undefined }
  const nextRest = { ...nextProps, items: undefined }

  return shallowEqual(prevRest, nextRest)
}

/**
 * Create a memoized selector
 * Returns cached result if inputs haven't changed
 */
export function createMemoizedSelector<TArgs extends unknown[], TResult>(
  selector: (...args: TArgs) => TResult
): (...args: TArgs) => TResult {
  let lastArgs: TArgs | undefined
  let lastResult: TResult

  return (...args: TArgs): TResult => {
    if (
      lastArgs &&
      args.length === lastArgs.length &&
      args.every((arg, i) => arg === lastArgs![i])
    ) {
      return lastResult
    }

    lastArgs = args
    lastResult = selector(...args)
    return lastResult
  }
}

// ============================================================================
// Performance Timing Utilities
// ============================================================================

/**
 * Measure execution time of a function
 */
export function measureTime<T>(fn: () => T, label?: string): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()

  if (label) {
    console.debug(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`)
  }

  return result
}

/**
 * Create a profiled version of a function
 */
export function profileFunction<T extends (...args: unknown[]) => unknown>(
  fn: T,
  label: string
): T {
  return ((...args: Parameters<T>) => {
    return measureTime(() => fn(...args), label)
  }) as T
}

// ============================================================================
// RAF Utilities
// ============================================================================

/**
 * Hook for requestAnimationFrame callbacks
 * Automatically cancels on unmount
 */
export function useAnimationFrame(callback: (deltaTime: number) => void) {
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current
        callbackRef.current(deltaTime)
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [])
}

/**
 * Batch multiple state updates into single frame
 */
export function batchUpdates(updates: Array<() => void>): void {
  requestAnimationFrame(() => {
    updates.forEach((update) => update())
  })
}
