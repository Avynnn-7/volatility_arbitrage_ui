/**
 * Test Utilities
 * Reusable utilities for testing React components with Redux and Router
 */

import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'

// ============================================================================
// Types
// ============================================================================

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Record<string, unknown>
  store?: EnhancedStore
  route?: string
  useMemoryRouter?: boolean
}

interface RenderWithProvidersResult extends RenderResult {
  store: EnhancedStore
}

// ============================================================================
// Mock Store Setup
// ============================================================================

// Default mock reducer for testing
const mockReducer = (state: Record<string, unknown> = {}) => state

/**
 * Create a test store with optional preloaded state
 */
export function createTestStore(preloadedState?: Record<string, unknown>): EnhancedStore {
  return configureStore({
    reducer: mockReducer,
    preloadedState: preloadedState ?? {
      surface: { currentSurface: null, correctedSurface: null, isLoading: false },
      arbitrage: { violations: [], isScanning: false },
      wizard: { step: 0, data: {} },
      ui: { sidebarCollapsed: false, theme: 'light' },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  })
}

// ============================================================================
// Custom Render
// ============================================================================

/**
 * Custom render function that wraps component with all providers
 * 
 * @example
 * ```tsx
 * import { renderWithProviders, screen } from '@/__tests__/testUtils'
 * 
 * test('renders component', () => {
 *   renderWithProviders(<MyComponent />)
 *   expect(screen.getByText('Hello')).toBeInTheDocument()
 * })
 * 
 * // With preloaded state
 * test('renders with state', () => {
 *   renderWithProviders(<MyComponent />, {
 *     preloadedState: {
 *       surface: { currentSurface: mockSurface }
 *     }
 *   })
 * })
 * 
 * // With specific route
 * test('renders at route', () => {
 *   renderWithProviders(<MyComponent />, {
 *     route: '/analysis/local-vol',
 *     useMemoryRouter: true
 *   })
 * })
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    route = '/',
    useMemoryRouter = false,
    ...renderOptions
  }: ExtendedRenderOptions = {}
): RenderWithProvidersResult {
  const RouterWrapper = useMemoryRouter
    ? ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      )
    : ({ children }: { children: ReactNode }) => (
        <BrowserRouter>{children}</BrowserRouter>
      )

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <RouterWrapper>{children}</RouterWrapper>
      </Provider>
    )
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Create mock volatility surface point
 */
export function createMockSurfacePoint(overrides?: Partial<{
  strike: number
  expiry: number
  impliedVol: number
  localVol: number
}>) {
  return {
    strike: 100,
    expiry: 0.25,
    impliedVol: 0.2,
    localVol: 0.22,
    ...overrides,
  }
}

/**
 * Create mock volatility surface
 */
export function createMockSurface(pointCount: number = 10) {
  const points = []
  for (let i = 0; i < pointCount; i++) {
    points.push(
      createMockSurfacePoint({
        strike: 80 + (i % 5) * 10,
        expiry: 0.1 + Math.floor(i / 5) * 0.25,
        impliedVol: 0.15 + Math.random() * 0.1,
      })
    )
  }
  return {
    id: `surface-${Date.now()}`,
    timestamp: new Date().toISOString(),
    points,
    metadata: {
      spotPrice: 100,
      riskFreeRate: 0.05,
    },
  }
}

/**
 * Create mock arbitrage violation
 */
export function createMockViolation(overrides?: Partial<{
  type: string
  strike: number
  expiry: number
  value: number
  severity: string
}>) {
  return {
    type: 'BUTTERFLY',
    strike: 100,
    expiry: 0.25,
    value: 0.001,
    severity: 'medium',
    ...overrides,
  }
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now()
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition')
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
}

/**
 * Create a deferred promise for testing async flows
 */
export function createDeferred<T>() {
  let resolve: (value: T) => void = () => {}
  let reject: (reason?: unknown) => void = () => {}
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  
  return { promise, resolve, reject }
}

// ============================================================================
// Event Utilities
// ============================================================================

/**
 * Create a mock keyboard event
 */
export function createKeyboardEvent(key: string, options?: Partial<KeyboardEvent>) {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  })
}

/**
 * Create a mock pointer event
 */
export function createPointerEvent(type: string, options?: Partial<PointerEvent>) {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    ...options,
  })
}

// ============================================================================
// Re-exports
// ============================================================================

// Re-export everything from testing-library for convenience
/* eslint-disable react-refresh/only-export-components */
export * from '@testing-library/react'
export { renderWithProviders as render }
