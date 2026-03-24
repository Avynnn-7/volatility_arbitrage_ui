/**
 * upstoxApi.ts
 * ==============
 * TypeScript service layer for Upstox data — calls OUR Node.js backend proxy,
 * which then calls Upstox. The browser NEVER directly contacts Upstox or sees
 * the access token.
 *
 * Architecture:
 *   React UI → /api/upstox/* (our server) → Upstox API
 *
 * All requests go to the Node.js server defined by VITE_API_URL.
 */

import { apiFetch } from '../api'

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type Exchange = 'NSE_EQ' | 'BSE_EQ' | 'NSE_INDEX' | 'BSE_INDEX'

export interface LiveQuote {
  symbol: string
  exchange: Exchange
  instrumentKey: string
  quote: {
    last_price: number
    volume: number
    oi: number
    ohlc: { open: number; high: number; low: number; close: number }
    depth: {
      buy: Array<{ price: number; quantity: number; orders: number }>
      sell: Array<{ price: number; quantity: number; orders: number }>
    }
  } | null
}

export interface OptionChainEntry {
  strikePrice: number
  callOption: {
    instrumentKey: string
    lastPrice: number
    impliedVolatility: number
    openInterest: number
    volume: number
    bid: number
    ask: number
    greeks?: {
      delta: number
      gamma: number
      theta: number
      vega: number
    }
  } | null
  putOption: {
    instrumentKey: string
    lastPrice: number
    impliedVolatility: number
    openInterest: number
    volume: number
    bid: number
    ask: number
    greeks?: {
      delta: number
      gamma: number
      theta: number
      vega: number
    }
  } | null
}

export interface OptionChainResponse {
  success: boolean
  symbol: string
  exchange: Exchange
  expiry: string
  data: {
    data: {
      expiry: string
      strikeData: OptionChainEntry[]
    }[]
  }
}

export interface MarketStatusResponse {
  success: boolean
  data: {
    data: {
      exchange: string
      segment: string
      status: 'open' | 'close'
    }
  }
}

export interface AvailableExpiries {
  success: boolean
  symbol: string
  exchange: Exchange
  expiries: string[]
}

export interface HealthStatus {
  status: 'ok' | 'error'
  timestamp: string
  upstoxTokenConfigured: boolean
  mockMode: boolean
}

// ──────────────────────────────────────────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Check if backend server is up and Upstox token is configured.
 */
export function getHealthStatus(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/health')
}

/**
 * Get live market status (NSE/BSE open or closed).
 */
export function getMarketStatus(): Promise<MarketStatusResponse> {
  return apiFetch<MarketStatusResponse>('/upstox/market-status')
}

/**
 * Get real-time quote for a symbol (LTP, bid/ask, OI, volume).
 *
 * @param symbol - e.g. "RELIANCE", "NIFTY"
 * @param exchange - e.g. "NSE_EQ", "NSE_INDEX"
 */
export function getLiveQuote(symbol: string, exchange: Exchange = 'NSE_EQ'): Promise<LiveQuote> {
  const params = new URLSearchParams({ symbol, exchange })
  return apiFetch<LiveQuote>(`/upstox/quote?${params}`)
}

/**
 * Get available option expiry dates for a symbol.
 *
 * @param symbol - e.g. "NIFTY", "BANKNIFTY"
 * @param exchange - typically "NSE_INDEX" for indices
 */
export function getAvailableExpiries(
  symbol: string,
  exchange: Exchange = 'NSE_INDEX'
): Promise<AvailableExpiries> {
  const params = new URLSearchParams({ symbol, exchange })
  return apiFetch<AvailableExpiries>(`/upstox/expiries?${params}`)
}

/**
 * Fetch the full option chain for a symbol and optional expiry.
 * If expiry is omitted, the nearest expiry is used.
 *
 * @param symbol - e.g. "NIFTY"
 * @param exchange - e.g. "NSE_INDEX"
 * @param expiry - ISO date string e.g. "2025-01-30" (optional)
 */
export function getOptionChain(
  symbol: string,
  exchange: Exchange = 'NSE_INDEX',
  expiry?: string
): Promise<OptionChainResponse> {
  const params = new URLSearchParams({ symbol, exchange })
  if (expiry) params.set('expiry', expiry)
  return apiFetch<OptionChainResponse>(`/upstox/option-chain?${params}`)
}

/**
 * Get read-only portfolio positions and holdings.
 * Requires portfolio:read scope in the Upstox token.
 */
export function getPortfolio(): Promise<{
  success: boolean
  positions: unknown[]
  holdings: unknown[]
}> {
  return apiFetch('/upstox/portfolio')
}

/**
 * Run the C++ vol-arb analysis for a live symbol.
 * This calls the full arbitrage detection pipeline.
 */
export function runLiveArbitrageAnalysis(
  symbol: string,
  exchange: Exchange = 'NSE_INDEX'
): Promise<unknown> {
  const params = new URLSearchParams({ symbol, exchange })
  return apiFetch(`/analyze?${params}`)
}
