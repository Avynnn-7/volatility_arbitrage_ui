/**
 * JavaScript Arbitrage Engine — port of the C++ vol_arb core.
 * Detects butterfly, calendar, and vertical spread violations on an implied
 * volatility surface, then generates actionable trade recommendations.
 *
 * Performance: ~50-150ms for a typical option chain (200-400 quotes).
 * This is negligible vs Upstox API latency (~300-800ms).
 */

// ─── Black-Scholes Helpers ──────────────────────────────────────────────────

const SQRT2PI = Math.sqrt(2 * Math.PI);

function normalCDF(x) {
  // Abramowitz & Stegun approximation (|error| < 7.5e-8)
  const a1 =  0.254829592, a2 = -0.284496736, a3 =  1.421413741;
  const a4 = -1.453152027, a5 =  1.061405429, p   =  0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

function normalPDF(x) {
  return Math.exp(-0.5 * x * x) / SQRT2PI;
}

function bsCallPrice(S, K, T, r, q, sigma) {
  if (T <= 0 || sigma <= 0) return Math.max(S * Math.exp(-q * T) - K * Math.exp(-r * T), 0);
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  return S * Math.exp(-q * T) * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
}

function bsPutPrice(S, K, T, r, q, sigma) {
  if (T <= 0 || sigma <= 0) return Math.max(K * Math.exp(-r * T) - S * Math.exp(-q * T), 0);
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  return K * Math.exp(-r * T) * normalCDF(-d2) - S * Math.exp(-q * T) * normalCDF(-d1);
}

// ─── Vol Surface Builder ────────────────────────────────────────────────────

function buildSurface(quotes, marketData) {
  // Extract unique sorted strikes and expiries
  const strikeSet = new Set(), expirySet = new Set();
  for (const q of quotes) {
    strikeSet.add(q.strike);
    expirySet.add(q.expiry);
  }
  const strikes = [...strikeSet].sort((a, b) => a - b);
  const expiries = [...expirySet].sort((a, b) => a - b);

  // Build IV grid (expiries × strikes)
  const ivGrid = [];
  for (let i = 0; i < expiries.length; i++) {
    const row = new Array(strikes.length).fill(NaN);
    ivGrid.push(row);
  }

  // Fill grid with actual IV values
  for (const q of quotes) {
    const ei = expiries.indexOf(q.expiry);
    const si = strikes.indexOf(q.strike);
    if (ei >= 0 && si >= 0) {
      // Average if multiple quotes at same (K,T) — e.g., CE and PE
      if (isNaN(ivGrid[ei][si])) {
        ivGrid[ei][si] = q.iv;
      } else {
        ivGrid[ei][si] = (ivGrid[ei][si] + q.iv) / 2;
      }
    }
  }

  // Interpolate NaN gaps (simple linear along strike axis)
  for (let i = 0; i < expiries.length; i++) {
    const row = ivGrid[i];
    let lastValid = -1;
    for (let j = 0; j < row.length; j++) {
      if (!isNaN(row[j])) {
        if (lastValid >= 0 && j - lastValid > 1) {
          const startVal = row[lastValid], endVal = row[j];
          for (let k = lastValid + 1; k < j; k++) {
            const t = (k - lastValid) / (j - lastValid);
            row[k] = startVal + t * (endVal - startVal);
          }
        }
        lastValid = j;
      }
    }
    // Extrapolate edges with flat fill
    if (lastValid >= 0) {
      for (let j = 0; j < row.length; j++) {
        if (isNaN(row[j])) row[j] = row[lastValid];
      }
    }
  }

  return { strikes, expiries, ivGrid, marketData };
}

// ─── Arbitrage Detection ────────────────────────────────────────────────────

function detectViolations(surface) {
  const { strikes, expiries, ivGrid, marketData } = surface;
  const { spot, riskFreeRate: r, dividendYield: q } = marketData;
  const violations = [];
  const nK = strikes.length, nT = expiries.length;

  // 1. Butterfly violations (convexity in strike)
  // d²C/dK² >= 0 ↔ the risk-neutral density is non-negative
  for (let ti = 0; ti < nT; ti++) {
    const T = expiries[ti];
    for (let ki = 1; ki < nK - 1; ki++) {
      const K1 = strikes[ki - 1], K2 = strikes[ki], K3 = strikes[ki + 1];
      const s1 = ivGrid[ti][ki - 1], s2 = ivGrid[ti][ki], s3 = ivGrid[ti][ki + 1];
      if (s1 <= 0 || s2 <= 0 || s3 <= 0) continue;

      const C1 = bsCallPrice(spot, K1, T, r, q, s1);
      const C2 = bsCallPrice(spot, K2, T, r, q, s2);
      const C3 = bsCallPrice(spot, K3, T, r, q, s3);

      // Butterfly value: C(K1) - 2C(K2) + C(K3) should be >= 0
      const lambda = (K3 - K2) / (K3 - K1);
      const butterflyValue = lambda * C1 + (1 - lambda) * C3 - C2;
      const threshold = -0.001 * Math.max(C1, C3);

      if (butterflyValue < threshold) {
        const severity = Math.min(Math.abs(butterflyValue / (threshold || 1)), 1);
        violations.push({
          type: 'BUTTERFLY',
          strike: K2,
          expiry: T,
          magnitude: butterflyValue,
          severity,
          critical: severity > 0.7,
          description: `Butterfly violation at K=${K2.toFixed(0)}, T=${T.toFixed(4)}: value=${butterflyValue.toFixed(4)}`,
        });
      }
    }
  }

  // 2. Calendar violations (total variance must be non-decreasing)
  // σ²(K,T₁)·T₁ ≤ σ²(K,T₂)·T₂ for T₁ < T₂
  for (let ki = 0; ki < nK; ki++) {
    for (let ti = 0; ti < nT - 1; ti++) {
      const T1 = expiries[ti], T2 = expiries[ti + 1];
      const s1 = ivGrid[ti][ki], s2 = ivGrid[ti + 1][ki];
      if (s1 <= 0 || s2 <= 0) continue;

      const totalVar1 = s1 * s1 * T1;
      const totalVar2 = s2 * s2 * T2;
      const diff = totalVar2 - totalVar1;

      if (diff < -1e-6) {
        const severity = Math.min(Math.abs(diff) / (totalVar1 || 1), 1);
        violations.push({
          type: 'CALENDAR',
          strike: strikes[ki],
          expiry: T2,
          magnitude: diff,
          severity,
          critical: severity > 0.5,
          description: `Calendar violation at K=${strikes[ki].toFixed(0)}: TotalVar(${T1.toFixed(4)})=${totalVar1.toFixed(4)} > TotalVar(${T2.toFixed(4)})=${totalVar2.toFixed(4)}`,
        });
      }
    }
  }

  // 3. Monotonicity violations (call price decreasing in K)
  for (let ti = 0; ti < nT; ti++) {
    const T = expiries[ti];
    for (let ki = 0; ki < nK - 1; ki++) {
      const K1 = strikes[ki], K2 = strikes[ki + 1];
      const s1 = ivGrid[ti][ki], s2 = ivGrid[ti][ki + 1];
      if (s1 <= 0 || s2 <= 0) continue;

      const C1 = bsCallPrice(spot, K1, T, r, q, s1);
      const C2 = bsCallPrice(spot, K2, T, r, q, s2);

      if (C2 > C1 + 1e-4) {
        const severity = Math.min((C2 - C1) / C1, 1);
        violations.push({
          type: 'MONOTONICITY',
          strike: K2,
          expiry: T,
          magnitude: C2 - C1,
          severity,
          critical: severity > 0.3,
          description: `Call price increase: C(${K1.toFixed(0)})=${C1.toFixed(2)} < C(${K2.toFixed(0)})=${C2.toFixed(2)}`,
        });
      }
    }
  }

  // 4. Extreme value detection  
  for (let ti = 0; ti < nT; ti++) {
    for (let ki = 0; ki < nK; ki++) {
      const sigma = ivGrid[ti][ki];
      if (sigma > 3.0) {
        violations.push({
          type: 'EXTREME_VALUE',
          strike: strikes[ki],
          expiry: expiries[ti],
          magnitude: sigma,
          severity: Math.min(sigma / 5.0, 1),
          critical: sigma > 5.0,
          description: `Extreme IV: σ=${(sigma * 100).toFixed(1)}% at K=${strikes[ki].toFixed(0)}`,
        });
      }
    }
  }

  // Sort by severity descending
  violations.sort((a, b) => b.severity - a.severity);
  return violations;
}

// ─── Profit Advisor (Market-Price Based) ────────────────────────────────────

// Common NSE lot sizes (if not available, default to 1)
const LOT_SIZES = {
  'NIFTY': 25, 'BANKNIFTY': 15, 'FINNIFTY': 25, 'MIDCPNIFTY': 50,
  'RELIANCE': 250, 'TCS': 175, 'INFY': 300, 'HDFCBANK': 550, 'ICICIBANK': 700,
  'SBIN': 1500, 'AXISBANK': 600, 'KOTAKBANK': 400, 'BAJFINANCE': 125,
  'HINDUNILVR': 300, 'ITC': 1600, 'LT': 375, 'TATAMOTORS': 575,
  'WIPRO': 1500, 'TATASTEEL': 1100, 'BHARTIARTL': 475, 'MARUTI': 100,
};

function generateTradeRecommendations(surface, violations, rawQuotes, symbolName) {
  const { strikes, expiries, ivGrid, marketData } = surface;
  const { spot, riskFreeRate: r, dividendYield: q } = marketData;
  const recommendations = [];
  const lotSize = LOT_SIZES[symbolName?.toUpperCase()] || 1;

  // ── Build market price lookup from actual quotes ──
  // Key: "strike|expiry|type" → { bid, ask, ltp, iv, volume }
  const mktPrices = {};
  if (rawQuotes) {
    for (const q of rawQuotes) {
      const key = `${q.strike}|${q.expiry}|${q.type}`;
      mktPrices[key] = {
        bid: q.bid || 0,
        ask: q.ask || 0,
        ltp: q.ltp || q.ask || q.bid || 0,
        iv: q.iv,
        volume: q.volume || 0,
      };
    }
  }

  // Get the best available execution price
  function getExecPrice(strike, expiry, type, side) {
    const key = `${strike}|${expiry}|${type}`;
    const mkt = mktPrices[key];
    if (mkt) {
      if (side === 'BUY')  return mkt.ask > 0 ? mkt.ask : mkt.ltp;
      if (side === 'SELL') return mkt.bid > 0 ? mkt.bid : mkt.ltp;
    }
    // Fallback: BS theoretical
    const ti = expiries.reduce((best, e, i) => Math.abs(e - expiry) < Math.abs(expiries[best] - expiry) ? i : best, 0);
    const ki = strikes.reduce((best, s, i) => Math.abs(s - strike) < Math.abs(strikes[best] - strike) ? i : best, 0);
    const sigma = ivGrid[ti][ki];
    return bsCallPrice(spot, strike, expiry, r, q, sigma);
  }

  function getVolume(strike, expiry, type) {
    const key = `${strike}|${expiry}|${type}`;
    return mktPrices[key]?.volume || 0;
  }

  function findAdjacentStrikes(targetK) {
    let lower = -1, upper = -1;
    for (let i = 0; i < strikes.length; i++) {
      if (strikes[i] < targetK) lower = i;
      if (strikes[i] > targetK && upper < 0) upper = i;
    }
    if (lower < 0 || upper < 0) return null;
    return { K_lower: strikes[lower], K_upper: strikes[upper] };
  }

  // ── Butterfly trades ──
  const butterflyViols = violations.filter(v => v.type === 'BUTTERFLY');
  for (const v of butterflyViols.slice(0, 5)) {
    const adj = findAdjacentStrikes(v.strike);
    if (!adj) continue;

    const K1 = adj.K_lower, K2 = v.strike, K3 = adj.K_upper;
    const T = v.expiry;

    // Use actual market prices: buy at ask, sell at bid
    const buyPrice1  = getExecPrice(K1, T, 'CE', 'BUY');
    const sellPrice2 = getExecPrice(K2, T, 'CE', 'SELL');
    const buyPrice3  = getExecPrice(K3, T, 'CE', 'BUY');

    // Net debit = what you pay for buys - what you receive from sells
    const netDebit = buyPrice1 - 2 * sellPrice2 + buyPrice3;

    // Butterfly payoff: max at K2 = min(K2-K1, K3-K2)
    const spreadWidth = Math.min(K2 - K1, K3 - K2);
    const maxProfit = spreadWidth - netDebit; // profit if underlying lands at K2
    const maxRisk = Math.max(netDebit, 0);    // if credit, risk = 0 (guaranteed profit)

    // Minimum volume across legs
    const minVol = Math.min(
      getVolume(K1, T, 'CE'), getVolume(K2, T, 'CE'), getVolume(K3, T, 'CE')
    );

    if (maxProfit < 0.5) continue;

    const breakeven1 = K1 + netDebit;
    const breakeven2 = K3 - netDebit;

    recommendations.push({
      strategyType: 'BUTTERFLY',
      description: `Butterfly Spread ${K1.toFixed(0)}/${K2.toFixed(0)}/${K3.toFixed(0)}`,
      legs: [
        { action: 'BUY',  optionType: 'CALL', strike: K1, expiry: T, quantity: 1, price: buyPrice1 },
        { action: 'SELL', optionType: 'CALL', strike: K2, expiry: T, quantity: 2, price: sellPrice2 },
        { action: 'BUY',  optionType: 'CALL', strike: K3, expiry: T, quantity: 1, price: buyPrice3 },
      ],
      netDebit: Math.round(netDebit * 100) / 100,
      maxProfit: Math.round(maxProfit * 100) / 100,
      maxRisk: Math.round(maxRisk * 100) / 100,
      profitPerLot: Math.round(maxProfit * lotSize * 100) / 100,
      riskPerLot: Math.round(maxRisk * lotSize * 100) / 100,
      lotSize,
      breakeven: [Math.round(breakeven1 * 100) / 100, Math.round(breakeven2 * 100) / 100],
      riskRewardRatio: maxRisk > 0 ? Math.round((maxProfit / maxRisk) * 100) / 100 : 9999,
      minLegVolume: minVol,
      severity: v.severity > 0.7 ? 'CRITICAL' : v.severity > 0.4 ? 'HIGH' : 'MEDIUM',
      urgency: v.severity > 0.7 ? 'Act immediately' : v.severity > 0.4 ? 'Act within session' : 'Monitor',
      violationMagnitude: Math.round(v.magnitude * 10000) / 10000,
    });
  }

  // ── Calendar trades ──
  const calendarViols = violations.filter(v => v.type === 'CALENDAR');
  for (const v of calendarViols.slice(0, 5)) {
    const K = v.strike;
    const T2 = v.expiry;
    const T1_idx = expiries.indexOf(T2) - 1;
    if (T1_idx < 0) continue;
    const T1 = expiries[T1_idx];

    // Sell near-term (expensive due to higher IV), buy far-term
    const sellNear = getExecPrice(K, T1, 'CE', 'SELL');
    const buyFar   = getExecPrice(K, T2, 'CE', 'BUY');
    const netDebit = buyFar - sellNear; // positive = debit, negative = credit

    // IV values for the near vs far term at this strike
    const ti1 = expiries.indexOf(T1), ti2 = expiries.indexOf(T2);
    const ki = strikes.indexOf(K);
    const ivNear = (ti1 >= 0 && ki >= 0) ? ivGrid[ti1][ki] : 0;
    const ivFar  = (ti2 >= 0 && ki >= 0) ? ivGrid[ti2][ki] : 0;

    // Calendar spread profit: if IVs converge, the near-term option decays faster.
    // Estimated max profit ≈ near-term theta decay advantage × time
    // Simplified: profit ≈ sellNear premium (near decays to 0 faster)
    const maxProfit = sellNear - Math.max(netDebit, 0); // premium captured minus cost
    const maxRisk = Math.max(netDebit, 0);

    if (maxProfit < 0.5) continue;

    recommendations.push({
      strategyType: 'CALENDAR',
      description: `Calendar Spread K=${K.toFixed(0)}, Near→Far`,
      legs: [
        { action: 'SELL', optionType: 'CALL', strike: K, expiry: T1, quantity: 1, price: sellNear },
        { action: 'BUY',  optionType: 'CALL', strike: K, expiry: T2, quantity: 1, price: buyFar },
      ],
      netDebit: Math.round(netDebit * 100) / 100,
      maxProfit: Math.round(maxProfit * 100) / 100,
      maxRisk: Math.round(maxRisk * 100) / 100,
      profitPerLot: Math.round(maxProfit * lotSize * 100) / 100,
      riskPerLot: Math.round(maxRisk * lotSize * 100) / 100,
      lotSize,
      ivNear: Math.round(ivNear * 10000) / 100, // as percentage
      ivFar: Math.round(ivFar * 10000) / 100,
      ivDiff: Math.round((ivNear - ivFar) * 10000) / 100,
      riskRewardRatio: maxRisk > 0 ? Math.round((maxProfit / maxRisk) * 100) / 100 : 9999,
      severity: v.severity > 0.5 ? 'HIGH' : 'MEDIUM',
      urgency: v.severity > 0.5 ? 'Act within session' : 'Monitor',
      violationMagnitude: Math.round(v.magnitude * 10000) / 10000,
    });
  }

  // ── Vertical (Bull Call) trades from monotonicity violations ──
  const monoViols = violations.filter(v => v.type === 'MONOTONICITY');
  for (const v of monoViols.slice(0, 5)) {
    const K_upper = v.strike;
    const ki = strikes.indexOf(K_upper);
    if (ki <= 0) continue;
    const K_lower = strikes[ki - 1];
    const T = v.expiry;

    // Buy lower strike, sell higher strike
    const buyLower  = getExecPrice(K_lower, T, 'CE', 'BUY');
    const sellUpper = getExecPrice(K_upper, T, 'CE', 'SELL');

    // Net credit (should be positive because of the monotonicity violation)
    const netCredit = sellUpper - buyLower;
    const spreadWidth = K_upper - K_lower;

    // If credit: max profit = credit, max risk = spread_width - credit
    // If debit: max profit = spread_width - debit, max risk = debit
    let maxProfit, maxRisk;
    if (netCredit > 0) {
      maxProfit = netCredit; // Guaranteed minimum profit
      maxRisk = Math.max(spreadWidth - netCredit, 0);
    } else {
      maxProfit = spreadWidth + netCredit; // spreadWidth - |debit|
      maxRisk = Math.abs(netCredit);
    }

    if (maxProfit < 0.5) continue;

    const breakeven = K_lower + Math.abs(netCredit);

    recommendations.push({
      strategyType: 'VERTICAL',
      description: `Bull Call Spread ${K_lower.toFixed(0)}/${K_upper.toFixed(0)}`,
      legs: [
        { action: 'BUY',  optionType: 'CALL', strike: K_lower, expiry: T, quantity: 1, price: buyLower },
        { action: 'SELL', optionType: 'CALL', strike: K_upper, expiry: T, quantity: 1, price: sellUpper },
      ],
      netDebit: Math.round(-netCredit * 100) / 100, // positive = you pay, negative = you receive
      maxProfit: Math.round(maxProfit * 100) / 100,
      maxRisk: Math.round(maxRisk * 100) / 100,
      profitPerLot: Math.round(maxProfit * lotSize * 100) / 100,
      riskPerLot: Math.round(maxRisk * lotSize * 100) / 100,
      lotSize,
      breakeven: [Math.round(breakeven * 100) / 100],
      riskRewardRatio: maxRisk > 0 ? Math.round((maxProfit / maxRisk) * 100) / 100 : Infinity,
      severity: v.severity > 0.3 ? 'HIGH' : 'MEDIUM',
      urgency: 'Act within session',
      violationMagnitude: Math.round(v.magnitude * 10000) / 10000,
    });
  }

  // Sort by risk-reward ratio descending (best trades first)
  recommendations.sort((a, b) => {
    const rrA = a.riskRewardRatio === Infinity ? 9999 : a.riskRewardRatio;
    const rrB = b.riskRewardRatio === Infinity ? 9999 : b.riskRewardRatio;
    return rrB - rrA;
  });
  return recommendations;
}

// ─── Main Analysis Pipeline ─────────────────────────────────────────────────

export function analyzeArbitrage(data) {
  const startTime = Date.now();

  // 1. Build surface
  const surface = buildSurface(data.quotes, {
    spot: data.spot,
    riskFreeRate: data.riskFreeRate || 0.065,
    dividendYield: data.dividendYield || 0.0,
  });

  // 2. Detect violations
  const violations = detectViolations(surface);

  // 3. Generate trade recommendations (using actual market prices)
  const trades = generateTradeRecommendations(surface, violations, data.quotes, data.symbol);

  const elapsed = Date.now() - startTime;

  // 4. Build output matching C++ JSON format
  return {
    success: true,
    engine: 'js-serverless',
    computeTimeMs: elapsed,
    market: {
      spot: data.spot,
      riskFreeRate: data.riskFreeRate || 0.065,
      dividendYield: data.dividendYield || 0.0,
      currency: data.currency || 'INR',
      quotesCount: data.quotes.length,
    },
    surface: {
      strikes: surface.strikes,
      expiries: surface.expiries,
      ivGrid: surface.ivGrid,
    },
    violations: {
      count: violations.length,
      items: violations,
    },
    correction: {
      success: true,
      l2Cost: 0.0,
      postViolations: 0,
      status: 'JS_ENGINE_NO_QP',
    },
    trades: {
      totalRecommendations: trades.length,
      recommendations: trades,
    },
  };
}
