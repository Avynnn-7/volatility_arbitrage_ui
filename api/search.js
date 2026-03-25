/**
 * Vercel Serverless Function: /api/search
 * 
 * Searches for instruments matching a query string — used for autocomplete.
 * 
 * Query params:
 *   q (required) — search string, e.g., "RELI", "NIFT", "TATA"
 */

import { searchInstruments } from './lib/upstox-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q || q.length < 1) {
    return res.status(400).json({ results: [] });
  }

  const token = process.env.UPSTOX_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ results: [], error: 'Token not configured' });
  }

  try {
    const results = await searchInstruments(String(q), token);
    return res.status(200).json({ results });
  } catch (err) {
    return res.status(500).json({ results: [], error: err.message });
  }
}
