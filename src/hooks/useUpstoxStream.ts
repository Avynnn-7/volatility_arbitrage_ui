/**
 * useUpstoxStream.ts
 * ====================
 * React hook for real-time Upstox price streaming via Server-Sent Events (SSE).
 *
 * The SSE endpoint (/api/stream) is on OUR Node.js server, which polls Upstox
 * on the backend. The access token is never exposed to the browser.
 *
 * Usage:
 *   const { quote, status, error } = useUpstoxStream('NIFTY', 'NSE_INDEX', 3000)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { API_BASE_URL } from '@/config'

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type StreamStatus = 'connecting' | 'connected' | 'error' | 'closed' | 'token-not-configured'

export interface StreamQuote {
  symbol: string
  exchange: string
  ltp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  oi: number
  bidPrice: number
  askPrice: number
  timestamp: string
  /** Price change from day open */
  change: number
  /** Percent change from day open */
  changePct: number
}

export interface UseUpstoxStreamReturn {
  /** Latest quote data */
  quote: StreamQuote | null
  /** Connection status */
  status: StreamStatus
  /** Error message if status is 'error' */
  error: string | null
  /** Count of received updates */
  updateCount: number
  /** Manually close and reopen the stream */
  reconnect: () => void
  /** Close the stream */
  close: () => void
}

// ──────────────────────────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Real-time Upstox price stream via SSE.
 *
 * @param symbol  - Stock/index symbol (e.g. "NIFTY", "RELIANCE")
 * @param exchange - Exchange code (e.g. "NSE_INDEX", "NSE_EQ")
 * @param intervalMs - Poll interval on the server side in ms (default: 3000)
 * @param enabled - Set to false to pause the stream
 */
export function useUpstoxStream(
  symbol: string,
  exchange: string = 'NSE_INDEX',
  intervalMs: number = 3000,
  enabled: boolean = true
): UseUpstoxStreamReturn {
  const [quote, setQuote] = useState<StreamQuote | null>(null)
  const [status, setStatus] = useState<StreamStatus>('closed')
  const [error, setError] = useState<string | null>(null)
  const [updateCount, setUpdateCount] = useState(0)

  const esRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectionKey = useRef(0)

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }

  const openStream = useCallback(() => {
    if (!symbol || !enabled) return

    // Close existing connection first
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
    clearReconnectTimer()

    const key = ++connectionKey.current

    const url = `${API_BASE_URL}/stream?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}&interval=${intervalMs}`
    setStatus('connecting')
    setError(null)

    const es = new EventSource(url)
    esRef.current = es

    es.addEventListener('connected', () => {
      if (connectionKey.current !== key) return
      console.log(`[Stream] Connected: ${symbol} (${exchange})`)
      setStatus('connected')
      setError(null)
    })

    es.addEventListener('quote', (event) => {
      if (connectionKey.current !== key) return
      try {
        const raw = JSON.parse(event.data) as Omit<StreamQuote, 'change' | 'changePct'>
        const enriched: StreamQuote = {
          ...raw,
          change: raw.ltp - (raw.open ?? raw.ltp),
          changePct: raw.open ? ((raw.ltp - raw.open) / raw.open) * 100 : 0,
        }
        setQuote(enriched)
        setUpdateCount(c => c + 1)
      } catch (e) {
        console.warn('[Stream] Failed to parse quote event:', e)
      }
    })

    es.addEventListener('error', (event) => {
      if (connectionKey.current !== key) return
      try {
        const payload = JSON.parse((event as MessageEvent).data ?? '{}')
        setError(payload.message || 'Stream error')
        setStatus('error')
      } catch {
        // SSE native error (network issue)
        setError('Connection error — check that the server is running.')
        setStatus('error')
      }
    })

    es.addEventListener('fatal', (event) => {
      if (connectionKey.current !== key) return
      try {
        const payload = JSON.parse((event as MessageEvent).data ?? '{}')
        setError(payload.message || 'Fatal stream error')
        setStatus('token-not-configured')
      } catch {
        setStatus('token-not-configured')
      }
      es.close()
      esRef.current = null
    })

    es.onerror = () => {
      if (connectionKey.current !== key) return
      // Don't set error on every onerror — EventSource auto-reconnects
      if (es.readyState === EventSource.CLOSED) {
        setStatus('error')
        setError('Stream closed unexpectedly. Reconnecting in 5s...')
        // Auto-reconnect after 5 seconds
        reconnectTimerRef.current = setTimeout(() => {
          if (connectionKey.current === key) openStream()
        }, 5000)
      }
    }
  }, [symbol, exchange, intervalMs, enabled])

  // Open stream when parameters change or enabled flips to true
  useEffect(() => {
    if (!enabled) {
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
        setStatus('closed')
      }
      return
    }
    openStream()

    return () => {
      ++connectionKey.current // Invalidate callbacks
      clearReconnectTimer()
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }
    }
  }, [symbol, exchange, intervalMs, enabled, openStream])

  const reconnect = useCallback(() => {
    setQuote(null)
    setUpdateCount(0)
    openStream()
  }, [openStream])

  const close = useCallback(() => {
    ++connectionKey.current
    clearReconnectTimer()
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
    setStatus('closed')
  }, [])

  return { quote, status, error, updateCount, reconnect, close }
}
