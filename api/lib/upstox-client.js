/**
 * Upstox API client for Vercel serverless functions.
 * Supports ALL stocks via dynamic instrument search — no hardcoded limits.
 */

// Fallback map for common indices (which don't appear in equity search)
const INDEX_INSTRUMENTS = {
  'NIFTY':      'NSE_INDEX|Nifty 50',
  'BANKNIFTY':  'NSE_INDEX|Nifty Bank',
  'FINNIFTY':   'NSE_INDEX|Nifty Fin Service',
  'MIDCPNIFTY': 'NSE_INDEX|NIFTY MID SELECT',
  'SENSEX':     'BSE_INDEX|SENSEX',
};

async function upstoxFetch(endpoint, token, version = 'v2') {
  const bearer = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  const res = await fetch(`https://api.upstox.com/${version}${endpoint}`, {
    headers: { 'Authorization': bearer, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upstox API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

/**
 * Dynamically resolve any symbol to its Upstox instrument_key.
 * Uses the Smart Instrument Search API — supports ALL NSE/BSE stocks.
 */
export async function resolveInstrumentKey(symbol, exchange, token) {
  // 1. Check index map first  
  if (exchange === 'NSE_INDEX' || exchange === 'BSE_INDEX') {
    const key = INDEX_INSTRUMENTS[symbol];
    if (key) return key;
    throw new Error(`Unknown index: ${symbol}. Supported indices: ${Object.keys(INDEX_INSTRUMENTS).join(', ')}`);
  }

  // 2. Use Upstox Smart Instrument Search for equities
  const seg = exchange === 'BSE_EQ' ? 'EQ' : 'EQ';
  const exch = exchange === 'BSE_EQ' ? 'BSE' : 'NSE';
  const searchUrl = `/instruments/search?query=${encodeURIComponent(symbol)}&exchanges=${exch}&segments=${seg}&records=5`;

  const data = await upstoxFetch(searchUrl, token);
  const results = data?.data || [];

  if (results.length === 0) {
    throw new Error(`No instrument found for "${symbol}" on ${exchange}. Check the symbol name.`);
  }

  // Find exact match by trading_symbol
  const exact = results.find(r =>
    r.trading_symbol?.toUpperCase() === symbol.toUpperCase() ||
    r.name?.toUpperCase() === symbol.toUpperCase()
  );
  const match = exact || results[0];
  return match.instrument_key;
}

/**
 * Search for instruments matching a query string — used for autocomplete.
 */
export async function searchInstruments(query, token) {
  if (!query || query.length < 1) return [];

  try {
    const data = await upstoxFetch(
      `/instruments/search?query=${encodeURIComponent(query)}&segments=EQ&records=12`,
      token
    );
    const results = data?.data || [];
    return results.map(r => ({
      symbol: r.trading_symbol,
      name: r.name,
      exchange: r.segment, // v2 'segment' holds "NSE_EQ" which the frontend UI expects
      instrumentKey: r.instrument_key,
      instrumentType: r.instrument_type,
    }));
  } catch {
    return [];
  }
}

// ─── Black-Scholes Implied Volatility Solver (After Hours Fallback) ───
function normalCDF(x) {
  const a1 =  0.254829592, a2 = -0.284496736, a3 =  1.421413741;
  const a4 = -1.453152027, a5 =  1.061405429, p   =  0.3275911;
  const sign = x < 0 ? -1 : 1;
  const xAbs = Math.abs(x) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * xAbs);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-xAbs * xAbs);
  return 0.5 * (1.0 + sign * y);
}

function bsPrice(S, K, T, r, q, sigma, type) {
  if (T <= 0 || sigma <= 0) return Math.max(type === 'CE' ? S - K : K - S, 0);
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  if (type === 'CE') return S * Math.exp(-q * T) * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
  else return K * Math.exp(-r * T) * normalCDF(-d2) - S * Math.exp(-q * T) * normalCDF(-d1);
}

function impliedVolatility(targetPrice, S, K, T, r, q, type) {
  let low = 0.0001, high = 5.0; // 0% to 500%
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    const price = bsPrice(S, K, T, r, q, mid, type);
    if (price > targetPrice) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}

export async function fetchOptionChain(symbol, exchange, token) {
  // Dynamically resolve the instrument key
  const instrumentKey = await resolveInstrumentKey(symbol, exchange, token);

  // 1. Fetch spot price (works even after hours)
  let spotPrice = 0;
  try {
    const quoteData = await upstoxFetch(
      `/market-quote/quotes?instrument_key=${encodeURIComponent(instrumentKey)}`, token
    );
    // V2 API keys the response arbitrarily (e.g. "NSE_EQ:RELIANCE" instead of "NSE_EQ|INE...").
    // Since we only query 1 instrument, we can safely take the first value.
    const quoteObj = Object.values(quoteData?.data || {})[0];
    spotPrice = quoteObj?.last_price || quoteObj?.ohlc?.close || 0;
  } catch { /* fallback below */ }

  // 2. Fetch available expiries
  const expiryData = await upstoxFetch(
    `/option/contract?instrument_key=${encodeURIComponent(instrumentKey)}`, token
  );
  const expiries = [...new Set(expiryData?.data?.map(d => d.expiry).filter(Boolean))].sort();
  if (expiries.length === 0) throw new Error(`No option contracts found for ${symbol}. This stock may not have F&O trading.`);

  const targetExpiries = expiries.slice(0, 3);

  // 3. Fetch option chains in parallel
  const allQuotes = [];
  await Promise.all(targetExpiries.map(async (expiry) => {
    try {
      const chainData = await upstoxFetch(
        `/option/chain?instrument_key=${encodeURIComponent(instrumentKey)}&expiry_date=${expiry}`, token
      );
      if (chainData?.status !== 'success' || !chainData?.data) return;

      const expiryDate = new Date(expiry + 'T15:30:00+05:30');
      const now = new Date();
      const T = Math.max((expiryDate - now) / (365.25 * 24 * 3600 * 1000), 0.0001);

      for (const item of chainData.data) {
        const strike = item.strike_price;
        if (!strike) continue;

        if (!spotPrice && item.call_options?.underlying_spot_price) {
          spotPrice = item.call_options.underlying_spot_price;
        }
        if (!spotPrice && item.put_options?.underlying_spot_price) {
          spotPrice = item.put_options.underlying_spot_price;
        }

        const ce = item.call_options?.market_data;
        if (ce) {
          let iv = (ce.iv || 0) / 100;
          const price = ce.ltp || ce.close_price;
          // Fallback to BS impl-vol solver if Upstox IV is missing (after hours) and we have a valid price
          if (iv <= 0.001 && price > 0 && spotPrice > 0) {
            iv = impliedVolatility(price, spotPrice, strike, T, 0.065, 0.0, 'CE');
          }
          if (iv > 0.001) {
            allQuotes.push({
              strike, expiry: parseFloat(T.toFixed(6)), iv,
              bid: ce.bid_price || 0, ask: ce.ask_price || 0,
              volume: ce.volume || 0, type: 'CE',
            });
          }
        }

        const pe = item.put_options?.market_data;
        if (pe) {
          let iv = (pe.iv || 0) / 100;
          const price = pe.ltp || pe.close_price;
          // Fallback to BS impl-vol solver
          if (iv <= 0.001 && price > 0 && spotPrice > 0) {
            iv = impliedVolatility(price, spotPrice, strike, T, 0.065, 0.0, 'PE');
          }
          if (iv > 0.001) {
            allQuotes.push({
              strike, expiry: parseFloat(T.toFixed(6)), iv,
              bid: pe.bid_price || 0, ask: pe.ask_price || 0,
              volume: pe.volume || 0, type: 'PE',
            });
          }
        }
      }
    } catch { /* skip failed expiries */ }
  }));

  if (!spotPrice) throw new Error('Could not determine spot price. Check if the symbol is valid.');

  if (allQuotes.length === 0) {
    throw new Error('No valid option quotes with IV data (or traded prices) could be calculated.');
  }

  return {
    spot: spotPrice,
    riskFreeRate: 0.065,
    dividendYield: 0.0,
    valuationDate: new Date().toISOString().split('T')[0],
    currency: 'INR',
    quotes: allQuotes,
    expiries: targetExpiries,
    quotesCount: allQuotes.length,
  };
}
