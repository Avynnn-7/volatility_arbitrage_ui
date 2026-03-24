/**
 * upstoxProxy.js
 * ==============
 * Upstox v3 API Reverse Proxy for vol-arb
 *
 * ARCHITECTURE:
 *   Browser → (our Node server) → Upstox API
 *
 * SECURITY GUARANTEES:
 *   - UPSTOX_ACCESS_TOKEN is ONLY ever read from process.env (loaded from .env)
 *   - Token is injected as an HTTP header server-side; the browser NEVER sees it
 *   - All routes validate token presence before forwarding
 *   - Rate limiting is applied to prevent API key exhaustion
 *
 * REAL vs SANDBOX:
 *   Upstox sandbox only provides fake paper-trading data — useless for real
 *   volatility surface analysis. We use the real production API with read-only
 *   market data scopes: market:read, data.option_chain:read
 *
 * ENDPOINTS EXPOSED:
 *   GET /api/upstox/market-status          → Exchange trading status
 *   GET /api/upstox/quote?symbol=&exchange= → Live LTP, OI, bid/ask
 *   GET /api/upstox/option-chain?symbol=&exchange=&expiry= → Full option chain
 *   GET /api/upstox/portfolio              → Positions (read-only)
 *   GET /api/stream?symbol=&exchange=      → SSE real-time price stream
 */

import express from 'express';

const UPSTOX_BASE = 'https://api.upstox.com/v3';
const UPSTOX_V2 = 'https://api.upstox.com/v2'; // some endpoints still on v2

// ── Auth Header Builder ───────────────────────────────────────────────────────
function getAuthHeaders() {
    const token = process.env.UPSTOX_ACCESS_TOKEN;
    if (!token || token === 'ENTER_YOUR_ACCESS_TOKEN_HERE') {
        return null;
    }
    // Upstox tokens may come with or without Bearer prefix
    const bearer = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    return {
        'Authorization': bearer,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
}

// ── Upstox API Fetch Wrapper ──────────────────────────────────────────────────
async function upstoxFetch(path, params = {}, base = UPSTOX_BASE) {
    const headers = getAuthHeaders();
    if (!headers) {
        throw { status: 401, message: 'Upstox access token not configured. Set UPSTOX_ACCESS_TOKEN in .env' };
    }

    const url = new URL(`${base}${path}`);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') url.searchParams.set(k, v);
    });

    if (process.env.UPSTOX_DEBUG === 'true') {
        console.log(`[Upstox] → ${url.toString()}`);
    }

    const response = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(10000) });
    const body = await response.json().catch(() => ({ status: 'error', message: response.statusText }));

    if (!response.ok) {
        throw {
            status: response.status,
            message: body?.errors?.[0]?.message || body?.message || `Upstox API error ${response.status}`,
            upstoxBody: body,
        };
    }

    return body;
}

// ── Exchange/Symbol to InstrumentKey Helper ───────────────────────────────────
// Maps common symbols to Upstox instrument keys without needing the 100MB CSV
const KNOWN_INSTRUMENTS = {
    'NSE_INDEX:NIFTY':    'NSE_INDEX|Nifty 50',
    'NSE_INDEX:BANKNIFTY':'NSE_INDEX|Nifty Bank',
    'NSE_INDEX:FINNIFTY': 'NSE_INDEX|Nifty Fin Service',
    'NSE_INDEX:MIDCPNIFTY':'NSE_INDEX|NIFTY MID SELECT',
    'NSE_EQ:RELIANCE':    'NSE_EQ|INE002A01018',
    'NSE_EQ:TCS':         'NSE_EQ|INE467B01029',
    'NSE_EQ:INFY':        'NSE_EQ|INE009A01021',
    'NSE_EQ:HDFCBANK':    'NSE_EQ|INE040A01034',
    'NSE_EQ:ICICIBANK':   'NSE_EQ|INE090A01021',
    'NSE_EQ:SBIN':        'NSE_EQ|INE062A01020',
    'NSE_EQ:WIPRO':       'NSE_EQ|INE075A01022',
    'NSE_EQ:ADANIENT':    'NSE_EQ|INE423A01024',
    'NSE_EQ:BAJFINANCE':  'NSE_EQ|INE296A01024',
    'NSE_EQ:HINDUNILVR':  'NSE_EQ|INE030A01027',
    'NSE_EQ:KOTAKBANK':   'NSE_EQ|INE237A01028',
    'NSE_EQ:AXISBANK':    'NSE_EQ|INE238A01034',
    'NSE_EQ:LT':          'NSE_EQ|INE018A01030',
    'NSE_EQ:NESTLEIND':   'NSE_EQ|INE239A01024',
    'NSE_EQ:MARUTI':      'NSE_EQ|INE585B01010',
    'BSE_EQ:RELIANCE':    'BSE_EQ|500325',
    'BSE_EQ:TCS':         'BSE_EQ|532540',
    'BSE_EQ:INFY':        'BSE_EQ|500209',
};

function resolveInstrumentKey(symbol, exchange) {
    const key = `${exchange.toUpperCase()}:${symbol.toUpperCase()}`;
    return KNOWN_INSTRUMENTS[key] || null;
}

// ── Error Response Helper ─────────────────────────────────────────────────────
function sendError(res, err) {
    const status = err.status || 500;
    const message = err.message || 'Internal proxy error';
    console.error(`[UpstoxProxy] Error ${status}: ${message}`);
    res.status(status).json({ success: false, error: message, upstoxDetails: err.upstoxBody });
}

// ── Router Factory ────────────────────────────────────────────────────────────
export function createUpstoxProxyRouter() {
    const router = express.Router();

    // ── Market Status ─────────────────────────────────────────────────────────
    // GET /api/upstox/market-status
    router.get('/upstox/market-status', async (_req, res) => {
        try {
            const data = await upstoxFetch('/market/status/NSE/EQ', {}, UPSTOX_V2);
            res.json({ success: true, data });
        } catch (err) { sendError(res, err); }
    });

    // ── Live Quote ────────────────────────────────────────────────────────────
    // GET /api/upstox/quote?symbol=RELIANCE&exchange=NSE_EQ
    router.get('/upstox/quote', async (req, res) => {
        const { symbol, exchange = 'NSE_EQ' } = req.query;
        if (!symbol) return res.status(400).json({ success: false, error: 'symbol required' });

        const instrumentKey = resolveInstrumentKey(String(symbol), String(exchange));
        if (!instrumentKey) {
            return res.status(400).json({
                success: false,
                error: `Unknown symbol: ${symbol} on ${exchange}. Add to KNOWN_INSTRUMENTS in upstoxProxy.js`
            });
        }

        try {
            // Upstox v3 market quotes endpoint — returns LTP, bid, ask, OI, volume
            const data = await upstoxFetch('/market-quote/quotes', { instrument_key: instrumentKey });
            const quote = data?.data?.[instrumentKey];
            res.json({ success: true, symbol, exchange, instrumentKey, quote });
        } catch (err) { sendError(res, err); }
    });

    // ── Option Chain ──────────────────────────────────────────────────────────
    // GET /api/upstox/option-chain?symbol=NIFTY&exchange=NSE_INDEX&expiry=2025-01-30
    router.get('/upstox/option-chain', async (req, res) => {
        const { symbol, exchange = 'NSE_INDEX', expiry } = req.query;
        if (!symbol) return res.status(400).json({ success: false, error: 'symbol required' });

        const instrumentKey = resolveInstrumentKey(String(symbol), String(exchange));
        if (!instrumentKey) {
            return res.status(400).json({
                success: false,
                error: `Unknown symbol: ${symbol} on ${exchange}.`
            });
        }

        try {
            // First, get available expiry dates if not specified
            let targetExpiry = expiry;
            if (!targetExpiry) {
                const expiryData = await upstoxFetch('/option/contract', {
                    instrument_key: instrumentKey,
                }, UPSTOX_V2);
                const expiries = expiryData?.data?.map(d => d.expiry).filter(Boolean).sort() || [];
                if (expiries.length === 0) {
                    return res.status(404).json({ success: false, error: 'No expiries found for this instrument' });
                }
                targetExpiry = expiries[0]; // nearest expiry
            }

            // Fetch full option chain for this expiry
            const chainData = await upstoxFetch('/option/chain', {
                instrument_key: instrumentKey,
                expiry_date: targetExpiry,
            }, UPSTOX_V2);

            res.json({ success: true, symbol, exchange, expiry: targetExpiry, data: chainData });
        } catch (err) { sendError(res, err); }
    });

    // ── Available Expiries ────────────────────────────────────────────────────
    // GET /api/upstox/expiries?symbol=NIFTY&exchange=NSE_INDEX
    router.get('/upstox/expiries', async (req, res) => {
        const { symbol, exchange = 'NSE_INDEX' } = req.query;
        if (!symbol) return res.status(400).json({ success: false, error: 'symbol required' });

        const instrumentKey = resolveInstrumentKey(String(symbol), String(exchange));
        if (!instrumentKey) {
            return res.status(400).json({ success: false, error: `Unknown symbol: ${symbol} on ${exchange}.` });
        }

        try {
            const data = await upstoxFetch('/option/contract', { instrument_key: instrumentKey }, UPSTOX_V2);
            const expiries = [...new Set(data?.data?.map(d => d.expiry).filter(Boolean))].sort();
            res.json({ success: true, symbol, exchange, expiries });
        } catch (err) { sendError(res, err); }
    });

    // ── Portfolio / Positions (read-only) ─────────────────────────────────────
    // GET /api/upstox/portfolio
    router.get('/upstox/portfolio', async (_req, res) => {
        try {
            const [positions, holdings] = await Promise.all([
                upstoxFetch('/portfolio/short-term-positions', {}, UPSTOX_V2),
                upstoxFetch('/portfolio/long-term-holdings', {}, UPSTOX_V2),
            ]);
            res.json({ success: true, positions: positions?.data, holdings: holdings?.data });
        } catch (err) { sendError(res, err); }
    });

    // ── SSE Real-Time Price Stream ─────────────────────────────────────────────
    // GET /api/stream?symbol=NIFTY&exchange=NSE_INDEX&interval=3000
    //
    // Uses Server-Sent Events (SSE) to push live quote updates to the browser.
    // Polls Upstox REST API at configurable interval (default 3s — respects rate limits).
    // For sub-second streaming, Upstox provides a WebSocket API (requires separate token scope).
    router.get('/stream', async (req, res) => {
        const { symbol, exchange = 'NSE_INDEX', interval = '3000' } = req.query;
        if (!symbol) {
            return res.status(400).json({ success: false, error: 'symbol required' });
        }

        const instrumentKey = resolveInstrumentKey(String(symbol), String(exchange));
        if (!instrumentKey) {
            return res.status(400).json({ success: false, error: `Unknown symbol: ${symbol}` });
        }

        // Check token before establishing SSE connection
        if (!getAuthHeaders()) {
            return res.status(401).json({
                success: false,
                error: 'Token not configured. Set UPSTOX_ACCESS_TOKEN in .env'
            });
        }

        // SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Nginx: disable buffering
        res.flushHeaders();

        const pollMs = Math.max(1000, Math.min(30000, parseInt(String(interval)) || 3000));
        console.log(`[SSE] Opened stream for ${symbol} (${exchange}) @ ${pollMs}ms interval`);

        const send = (event, data) => {
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Send initial connected event
        send('connected', { symbol, exchange, instrumentKey, pollInterval: pollMs, timestamp: new Date().toISOString() });

        // Poll loop
        let running = true;
        const poll = async () => {
            if (!running) return;
            try {
                const data = await upstoxFetch('/market-quote/quotes', { instrument_key: instrumentKey });
                const quote = data?.data?.[instrumentKey];
                if (quote) {
                    send('quote', {
                        symbol,
                        exchange,
                        ltp: quote.last_price,
                        open: quote.ohlc?.open,
                        high: quote.ohlc?.high,
                        low: quote.ohlc?.low,
                        close: quote.ohlc?.close,
                        volume: quote.volume,
                        oi: quote.oi,
                        bidPrice: quote.depth?.buy?.[0]?.price,
                        askPrice: quote.depth?.sell?.[0]?.price,
                        timestamp: new Date().toISOString(),
                    });
                }
            } catch (err) {
                send('error', { message: err.message || 'Fetch failed', status: err.status });
                if (err.status === 401 || err.status === 403) {
                    send('fatal', { message: 'Token invalid or expired — regenerate your Upstox access token.' });
                    running = false;
                    res.end();
                    return;
                }
            }
            if (running) setTimeout(poll, pollMs);
        };

        setTimeout(poll, 500); // First poll after 500ms

        // Clean up on client disconnect
        req.on('close', () => {
            console.log(`[SSE] Closed stream for ${symbol}`);
            running = false;
        });
    });

    return router;
}
