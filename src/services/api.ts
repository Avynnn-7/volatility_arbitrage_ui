/**
 * Base API configuration and utilities
 */

import { API_BASE_URL, API_TIMEOUT } from '@/config'

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public status: number
  public code?: string
  public details?: Record<string, unknown>

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/**
 * Fetch wrapper with timeout and error handling
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new ApiError(
        errorBody.error?.message || `HTTP error ${response.status}`,
        response.status,
        errorBody.error?.code,
        errorBody.error?.details
      )
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return response.json()
    }
    
    return {} as T
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408, 'TIMEOUT')
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      'NETWORK_ERROR'
    )
  }
}

/**
 * GET request
 */
export function apiGet<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: 'GET' })
}

/**
 * POST request
 */
export function apiPost<T, D = unknown>(endpoint: string, data: D): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Download file
 */
export async function apiDownload(
  endpoint: string,
  data: unknown,
  filename: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new ApiError(`Download failed: ${response.status}`, response.status)
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
