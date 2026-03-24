/**
 * Upstox API client for Vercel serverless functions.
 * Fetches option chain data and converts to vol_arb format.
 */

const KNOWN_INSTRUMENTS = {
  'NSE_INDEX:NIFTY':     'NSE_INDEX|Nifty 50',
  'NSE_INDEX:BANKNIFTY': 'NSE_INDEX|Nifty Bank',
  'NSE_INDEX:FINNIFTY':  'NSE_INDEX|Nifty Fin Service',
  'NSE_INDEX:MIDCPNIFTY':'NSE_INDEX|NIFTY MID SELECT',
  'NSE_EQ:RELIANCE':     'NSE_EQ|INE002A01018',
  'NSE_EQ:TCS':          'NSE_EQ|INE467B01029',
  'NSE_EQ:INFY':         'NSE_EQ|INE009A01021',
  'NSE_EQ:HDFCBANK':     'NSE_EQ|INE040A01034',
  'NSE_EQ:ICICIBANK':    'NSE_EQ|INE090A01021',
  'NSE_EQ:SBIN':         'NSE_EQ|INE062A01020',
  'NSE_EQ:WIPRO':        'NSE_EQ|INE075A01022',
  'NSE_EQ:ADANIENT':     'NSE_EQ|INE423A01024',
  'NSE_EQ:BAJFINANCE':   'NSE_EQ|INE296A01024',
  'NSE_EQ:HINDUNILVR':   'NSE_EQ|INE030A01027',
  'NSE_EQ:KOTAKBANK':    'NSE_EQ|INE237A01028',
  'NSE_EQ:AXISBANK':     'NSE_EQ|INE238A01034',
  'NSE_EQ:LT':           'NSE_EQ|INE018A01030',
  'NSE_EQ:NESTLEIND':    'NSE_EQ|INE239A01024',
  'NSE_EQ:MARUTI':       'NSE_EQ|INE585B01010',
  'BSE_EQ:RELIANCE':     'BSE_EQ|500325',
  'BSE_EQ:TCS':          'BSE_EQ|532540',
  'BSE_EQ:INFY':         'BSE_EQ|500209',
};

export function getSupportedSymbols() {
  const symbols = new Set();
  for (const key of Object.keys(KNOWN_INSTRUMENTS)) {
    symbols.add(key.split(':')[1]);
  }
  return [...symbols].sort();
}

async function upstoxFetch(endpoint, token) {
  const bearer = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  const res = await fetch(`https://api.upstox.com/v2${endpoint}`, {
    headers: { 'Authorization': bearer, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upstox API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

export async function fetchOptionChain(symbol, exchange, token) {
  const instrumentKey = KNOWN_INSTRUMENTS[`${exchange}:${symbol}`];
  if (!instrumentKey) {
    throw new Error(`Unknown symbol: ${symbol} on ${exchange}. Supported: ${getSupportedSymbols().join(', ')}`);
  }

  // 1. Fetch spot price (works even after hours)
  let spotPrice = 0;
  try {
    const quoteData = await upstoxFetch(
      `/market-quote/quotes?instrument_key=${encodeURIComponent(instrumentKey)}`, token
    );
    const colonKey = instrumentKey.replace('|', ':');
    const quoteObj = quoteData?.data?.[instrumentKey] || quoteData?.data?.[colonKey];
    spotPrice = quoteObj?.last_price || quoteObj?.ohlc?.close || 0;
  } catch { /* fallback below */ }

  // 2. Fetch available expiries
  const expiryData = await upstoxFetch(
    `/option/contract?instrument_key=${encodeURIComponent(instrumentKey)}`, token
  );
  const expiries = [...new Set(expiryData?.data?.map(d => d.expiry).filter(Boolean))].sort();
  if (expiries.length === 0) throw new Error('No expiry dates returned from Upstox.');

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

        // CALL side
        const ce = item.call_options?.market_data;
        if (ce) {
          const iv = (ce.iv || 0) / 100;
          if (iv > 0.001) {
            allQuotes.push({
              strike, expiry: parseFloat(T.toFixed(6)), iv,
              bid: ce.bid_price || 0, ask: ce.ask_price || 0,
              volume: ce.volume || 0, type: 'CE',
            });
          }
        }

        // PUT side
        const pe = item.put_options?.market_data;
        if (pe) {
          const iv = (pe.iv || 0) / 100;
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

  if (!spotPrice) throw new Error('Could not determine spot price. Market may be closed or token may be invalid.');

  if (allQuotes.length === 0) {
    const now = new Date();
    const istHour = (now.getUTCHours() + 5) % 24 + (now.getUTCMinutes() + 30 >= 60 ? 1 : 0);
    const marketOpen = istHour >= 9 && istHour < 16;
    if (!marketOpen) {
      throw new Error(
        `Market is currently closed (IST ~${istHour}:${String(now.getUTCMinutes()).padStart(2,'0')}). ` +
        `IV data is only available during market hours (9:15 AM – 3:30 PM IST). ` +
        `Spot price: ₹${spotPrice.toFixed(2)}.`
      );
    }
    throw new Error('No valid option quotes with IV data returned.');
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
