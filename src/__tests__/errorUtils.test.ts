/**
 * Error Utilities Tests
 * Tests for error handling utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createAppError,
  parseError,
  isAppError,
  formatErrorForDisplay,
  logError,
  getErrorLog,
  clearErrorLog,
  withRetry,
  configureErrorLogger,
} from '@/utils/errors'

describe('Error Utilities', () => {
  beforeEach(() => {
    clearErrorLog()
    // Configure logger for testing
    configureErrorLogger({
      enableConsole: false,
      enableRemote: false,
    })
  })

  afterEach(() => {
    clearErrorLog()
  })

  describe('createAppError', () => {
    it('should create a basic error with defaults', () => {
      const error = createAppError('NETWORK_ERROR', 'Connection failed')

      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.message).toBe('Connection failed')
      expect(error.severity).toBe('error')
      expect(error.recoverable).toBe(false)
      expect(error.timestamp).toBeDefined()
      expect(typeof error.timestamp).toBe('number')
    })

    it('should create an error with custom options', () => {
      const originalError = new Error('Original')
      const error = createAppError('VALIDATION_ERROR', 'Invalid input', {
        severity: 'warning',
        originalError,
        context: { field: 'email' },
        recoverable: true,
        recoveryAction: 'Please check your input',
      })

      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.severity).toBe('warning')
      expect(error.originalError).toBe(originalError)
      expect(error.context).toEqual({ field: 'email' })
      expect(error.recoverable).toBe(true)
      expect(error.recoveryAction).toBe('Please check your input')
      expect(error.stack).toBe(originalError.stack)
    })
  })

  describe('parseError', () => {
    it('should return AppError as-is', () => {
      const appError = createAppError('API_ERROR', 'API failed')
      const parsed = parseError(appError)

      expect(parsed).toBe(appError)
    })

    it('should parse standard Error', () => {
      const error = new Error('Something went wrong')
      const parsed = parseError(error)

      expect(parsed.message).toBe('Something went wrong')
      expect(parsed.originalError).toBe(error)
      expect(parsed.timestamp).toBeDefined()
    })

    it('should parse network errors', () => {
      const error = new Error('Network request failed')
      const parsed = parseError(error)

      expect(parsed.code).toBe('NETWORK_ERROR')
      expect(parsed.recoverable).toBe(true)
    })

    it('should parse timeout errors', () => {
      const error = new Error('Request timeout')
      const parsed = parseError(error)

      expect(parsed.code).toBe('TIMEOUT_ERROR')
      expect(parsed.recoverable).toBe(true)
    })

    it('should parse string errors', () => {
      const parsed = parseError('Simple error message')

      expect(parsed.code).toBe('UNKNOWN_ERROR')
      expect(parsed.message).toBe('Simple error message')
      expect(parsed.recoverable).toBe(true)
    })

    it('should handle unknown error types', () => {
      const parsed = parseError({ weird: 'object' })

      expect(parsed.code).toBe('UNKNOWN_ERROR')
      expect(parsed.recoverable).toBe(true)
    })

    it('should parse API error responses', () => {
      const apiError = { status: 404, message: 'Not found', data: { id: 123 } }
      const parsed = parseError(apiError)

      expect(parsed.code).toBe('API_ERROR')
      expect(parsed.message).toBe('Not found')
      expect(parsed.context).toEqual({ status: 404, data: { id: 123 } })
    })
  })

  describe('isAppError', () => {
    it('should return true for AppError', () => {
      const error = createAppError('UNKNOWN_ERROR', 'Test')
      expect(isAppError(error)).toBe(true)
    })

    it('should return false for standard Error', () => {
      const error = new Error('Test')
      expect(isAppError(error)).toBe(false)
    })

    it('should return false for non-objects', () => {
      expect(isAppError('string')).toBe(false)
      expect(isAppError(123)).toBe(false)
      expect(isAppError(null)).toBe(false)
      expect(isAppError(undefined)).toBe(false)
    })
  })

  describe('formatErrorForDisplay', () => {
    it('should format error with correct title', () => {
      const error = createAppError('NETWORK_ERROR', 'Connection failed')
      const formatted = formatErrorForDisplay(error)

      expect(formatted.title).toBe('Connection Error')
      expect(formatted.message).toBe('Connection failed')
    })

    it('should include recovery action if present', () => {
      const error = createAppError('VALIDATION_ERROR', 'Invalid input', {
        recoveryAction: 'Please check your input',
      })
      const formatted = formatErrorForDisplay(error)

      expect(formatted.action).toBe('Please check your input')
    })

    it('should handle all error codes', () => {
      const codes = [
        'NETWORK_ERROR',
        'VALIDATION_ERROR',
        'CALCULATION_ERROR',
        'RENDER_ERROR',
        'DATA_ERROR',
        'API_ERROR',
        'UNKNOWN_ERROR',
        'TIMEOUT_ERROR',
        'PERMISSION_ERROR',
        'NOT_FOUND_ERROR',
      ] as const

      codes.forEach((code) => {
        const error = createAppError(code, 'Test message')
        const formatted = formatErrorForDisplay(error)
        expect(formatted.title).toBeDefined()
        expect(formatted.title.length).toBeGreaterThan(0)
      })
    })
  })

  describe('logError', () => {
    it('should add error to log', () => {
      const error = createAppError('UNKNOWN_ERROR', 'Test message')
      logError(error, 'TestComponent')

      const logs = getErrorLog()
      expect(logs.length).toBe(1)
      expect(logs[0].source).toBe('TestComponent')
      expect(logs[0].message).toBe('Test message')
    })

    it('should parse non-AppError before logging', () => {
      logError(new Error('Standard error'), 'TestComponent')

      const logs = getErrorLog()
      expect(logs.length).toBe(1)
      expect(logs[0].message).toBe('Standard error')
    })

    it('should include user action if provided', () => {
      const error = createAppError('UNKNOWN_ERROR', 'Test')
      logError(error, 'TestComponent', 'Button click')

      const logs = getErrorLog()
      expect(logs[0].userAction).toBe('Button click')
    })

    it('should limit log size', () => {
      // Log more than MAX_LOG_ENTRIES (100)
      for (let i = 0; i < 150; i++) {
        logError(createAppError('UNKNOWN_ERROR', `Error ${i}`), 'Test')
      }

      const logs = getErrorLog()
      expect(logs.length).toBeLessThanOrEqual(100)
    })
  })

  describe('clearErrorLog', () => {
    it('should clear all logged errors', () => {
      logError(createAppError('UNKNOWN_ERROR', 'Test 1'), 'Test')
      logError(createAppError('UNKNOWN_ERROR', 'Test 2'), 'Test')

      expect(getErrorLog().length).toBe(2)

      clearErrorLog()

      expect(getErrorLog().length).toBe(0)
    })
  })

  describe('withRetry', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success')

      const result = await withRetry(fn, { maxRetries: 3 })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')

      const result = await withRetry(fn, { 
        maxRetries: 3, 
        baseDelayMs: 10,
        maxDelayMs: 50,
      })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(
        withRetry(fn, { maxRetries: 2, baseDelayMs: 10 })
      ).rejects.toThrow('Network error')

      expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should not retry non-recoverable errors', async () => {
      const typeError = new TypeError('Cannot read property')
      const fn = vi.fn().mockRejectedValue(typeError)

      await expect(
        withRetry(fn, { maxRetries: 3, baseDelayMs: 10 })
      ).rejects.toThrow()

      expect(fn).toHaveBeenCalledTimes(1)
    })
  })
})
