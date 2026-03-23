/**
 * Test Setup
 * Configuration and global setup for Vitest tests
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// ============================================================================
// Global Cleanup
// ============================================================================

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// ============================================================================
// Mock Implementations
// ============================================================================

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

// Mock IntersectionObserver
class MockIntersectionObserver {
  root = null
  rootMargin = ''
  thresholds = []
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn().mockReturnValue([])
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver

// Mock scrollTo
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo
Element.prototype.scrollIntoView = vi.fn()

// Mock getComputedStyle
const originalGetComputedStyle = window.getComputedStyle
window.getComputedStyle = (element: Element) => {
  try {
    return originalGetComputedStyle(element)
  } catch {
    return {
      getPropertyValue: () => '',
    } as unknown as CSSStyleDeclaration
  }
}

// ============================================================================
// WebGL / Three.js Mocks
// ============================================================================

// Mock WebGL context for Three.js
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextType: string) => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return {
      canvas: { width: 800, height: 600 },
      drawingBufferWidth: 800,
      drawingBufferHeight: 600,
      getExtension: vi.fn().mockReturnValue(null),
      getParameter: vi.fn().mockReturnValue(16),
      getShaderPrecisionFormat: vi.fn().mockReturnValue({
        precision: 23,
        rangeMax: 127,
        rangeMin: 127,
      }),
      createShader: vi.fn().mockReturnValue({}),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn().mockReturnValue(true),
      createProgram: vi.fn().mockReturnValue({}),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn().mockReturnValue(true),
      useProgram: vi.fn(),
      createBuffer: vi.fn().mockReturnValue({}),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      getAttribLocation: vi.fn().mockReturnValue(0),
      getUniformLocation: vi.fn().mockReturnValue({}),
      uniform1f: vi.fn(),
      uniform2f: vi.fn(),
      uniform3f: vi.fn(),
      uniform4f: vi.fn(),
      uniformMatrix4fv: vi.fn(),
      clearColor: vi.fn(),
      clear: vi.fn(),
      viewport: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      blendFunc: vi.fn(),
      depthFunc: vi.fn(),
      cullFace: vi.fn(),
      frontFace: vi.fn(),
      drawArrays: vi.fn(),
      drawElements: vi.fn(),
      createTexture: vi.fn().mockReturnValue({}),
      bindTexture: vi.fn(),
      texImage2D: vi.fn(),
      texParameteri: vi.fn(),
      generateMipmap: vi.fn(),
      createFramebuffer: vi.fn().mockReturnValue({}),
      bindFramebuffer: vi.fn(),
      framebufferTexture2D: vi.fn(),
      checkFramebufferStatus: vi.fn().mockReturnValue(36053), // FRAMEBUFFER_COMPLETE
      createRenderbuffer: vi.fn().mockReturnValue({}),
      bindRenderbuffer: vi.fn(),
      renderbufferStorage: vi.fn(),
      framebufferRenderbuffer: vi.fn(),
      deleteShader: vi.fn(),
      deleteProgram: vi.fn(),
      deleteBuffer: vi.fn(),
      deleteTexture: vi.fn(),
      deleteFramebuffer: vi.fn(),
      deleteRenderbuffer: vi.fn(),
      pixelStorei: vi.fn(),
      activeTexture: vi.fn(),
      scissor: vi.fn(),
      colorMask: vi.fn(),
      depthMask: vi.fn(),
      stencilMask: vi.fn(),
      stencilFunc: vi.fn(),
      stencilOp: vi.fn(),
      lineWidth: vi.fn(),
    }
  }
  return null
}) as unknown as typeof HTMLCanvasElement.prototype.getContext

// ============================================================================
// Fetch Mock
// ============================================================================

// Mock fetch for API testing
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    headers: new Headers(),
  })
) as unknown as typeof fetch
