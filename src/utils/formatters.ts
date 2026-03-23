/**
 * Formatting utility functions
 */

/**
 * Format a number as a percentage
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a currency value
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

/**
 * Format a date string
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (format === 'long') {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

/**
 * Format time to expiry (in years) to human-readable
 */
export function formatExpiry(years: number): string {
  if (years < 1 / 12) {
    const days = Math.round(years * 365)
    return `${days}D`
  } else if (years < 1) {
    const months = Math.round(years * 12)
    return `${months}M`
  } else {
    return `${years.toFixed(1)}Y`
  }
}

/**
 * Format strike price
 */
export function formatStrike(strike: number, decimals = 0): string {
  return strike.toFixed(decimals)
}

/**
 * Format implied volatility
 */
export function formatIV(iv: number): string {
  return `${(iv * 100).toFixed(2)}%`
}

/**
 * Format a duration in milliseconds to human-readable
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  } else {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let unitIndex = 0

  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024
    unitIndex++
  }

  return `${bytes.toFixed(1)} ${units[unitIndex]}`
}
