/**
 * Vercel Serverless Function: /api/analyze
 * 
 * Fetches live option chain from Upstox, runs the JS arbitrage engine,
 * and returns structured JSON results.
 * 
 * Query params:
 *   symbol   (required) — e.g., NIFTY, RELIANCE, BANKNIFTY
 *   exchange (optional) — NSE_EQ, NSE_INDEX, BSE_EQ (default: NSE_EQ)
 * 
 * Environment variables:
 *   UPSTOX_ACCESS_TOKEN — Upstox API Bearer token (set in Vercel dashboard)
 */

import { fetchOptionChain, getSupportedSymbols } from './lib/upstox-client.js';
import { analyzeArbitrage } from './lib/arbitrage-engine.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { symbol, exchange = 'NSE_EQ' } = req.query;

  if (!symbol) {
    return res.status(400).json({
      success: false,
      error: 'Symbol parameter is required.',
      supportedSymbols: getSupportedSymbols(),
    });
  }

  const token = process.env.UPSTOX_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({
      success: false,
      error: 'UPSTOX_ACCESS_TOKEN is not configured on the server.',
    });
  }

  const startTime = Date.now();

  try {
    // 1. Fetch option chain from Upstox
    const chainData = await fetchOptionChain(String(symbol).toUpperCase(), String(exchange), token);

    // 2. Run arbitrage analysis
    const result = analyzeArbitrage(chainData);

    // 3. Add metadata
    result.symbol = symbol.toUpperCase();
    result.exchange = exchange;
    result.timestamp = new Date().toISOString();
    result.totalLatencyMs = Date.now() - startTime;

    return res.status(200).json(result);

  } catch (err) {
    console.error(`[analyze] Error for ${symbol}:`, err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
      symbol: symbol.toUpperCase(),
      exchange,
      hint: 'Check if the market is open (9:15 AM – 3:30 PM IST) and the symbol is supported.',
      supportedSymbols: getSupportedSymbols(),
    });
  }
}
