import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createUpstoxProxyRouter } from './upstoxProxy.js';

// Load environment variables from .env (NEVER commit .env to git)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
    credentials: true,
}));
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${req.method} ${req.url}`);
    next();
});

// Path to the compiled C++ executable
const CPP_EXEC_PATH = path.resolve(__dirname, '../vol_arb/build/Release/vol_arb.exe');

// ── Upstox Proxy Router ───────────────────────────────────────────────────────
// All /api/upstox/* and /api/stream routes — secrets NEVER leave this process
app.use('/api', createUpstoxProxyRouter());

// ── Upstox → vol_arb JSON Converter ──────────────────────────────────────────
// Fetches live option chain from Upstox in Node (native HTTPS), converts to the
// vol_arb JSON wire format, then pipes to C++ via stdin.
// This means: C++ does ZERO network I/O — pure computation only.

// Reuse the same instrument map from upstoxProxy.js
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

async function fetchUpstoxOptionChain(symbol, exchange) {
    const token = process.env.UPSTOX_ACCESS_TOKEN;
    if (!token) throw new Error('UPSTOX_ACCESS_TOKEN not set.');

    const instrumentKey = KNOWN_INSTRUMENTS[`${exchange}:${symbol}`];
    if (!instrumentKey) throw new Error(`Unknown symbol: ${symbol} on ${exchange}. Add to KNOWN_INSTRUMENTS.`);

    const bearer = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const headers = { 'Authorization': bearer, 'Accept': 'application/json' };

    // 1. Fetch available expiries
    const expiryUrl = `https://api.upstox.com/v2/option/contract?instrument_key=${encodeURIComponent(instrumentKey)}`;
    const expiryRes = await fetch(expiryUrl, { headers, signal: AbortSignal.timeout(10000) });
    if (!expiryRes.ok) {
        const body = await expiryRes.text();
        throw new Error(`Upstox expiry API returned ${expiryRes.status}: ${body.slice(0, 300)}`);
    }
    const expiryData = await expiryRes.json();
    const expiries = [...new Set(expiryData?.data?.map(d => d.expiry).filter(Boolean))].sort();
    if (expiries.length === 0) throw new Error('No expiry dates returned from Upstox.');

    // Use nearest 3 expiries for a richer surface
    const targetExpiries = expiries.slice(0, 3);
    console.log(`[Backend] Fetching option chains for expiries: ${targetExpiries.join(', ')}`);

    // 2. Also fetch market quote for spot price (works even after hours)
    let spotPrice = 0;
    try {
        const quoteUrl = `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(instrumentKey)}`;
        const quoteRes = await fetch(quoteUrl, { headers, signal: AbortSignal.timeout(5000) });
        if (quoteRes.ok) {
            const quoteData = await quoteRes.json();
            // Upstox returns data keyed with colon separator (NSE_INDEX:Nifty 50)
            // but instrument keys use pipe (NSE_INDEX|Nifty 50)
            const colonKey = instrumentKey.replace('|', ':');
            const quoteObj = quoteData?.data?.[instrumentKey] || quoteData?.data?.[colonKey];
            spotPrice = quoteObj?.last_price || quoteObj?.ohlc?.close || 0;
            console.log(`[Backend] Spot price from market quote: ₹${spotPrice}`);
        }
    } catch { /* fallback below */ }

    // 3. Fetch option chain for each expiry in parallel
    const allQuotes = [];

    await Promise.all(targetExpiries.map(async (expiry) => {
        const chainUrl = `https://api.upstox.com/v2/option/chain?instrument_key=${encodeURIComponent(instrumentKey)}&expiry_date=${expiry}`;
        const chainRes = await fetch(chainUrl, { headers, signal: AbortSignal.timeout(10000) });
        if (!chainRes.ok) return; // skip failed expiries
        const chainData = await chainRes.json();
        if (chainData?.status !== 'success' || !chainData?.data) return;

        // Compute T (time to maturity in years)
        const expiryDate = new Date(expiry + 'T15:30:00+05:30'); // IST market close
        const now = new Date();
        const T = Math.max((expiryDate - now) / (365.25 * 24 * 3600 * 1000), 0.0001);

        for (const item of chainData.data) {
            const strike = item.strike_price;
            if (!strike) continue;

            // Extract spot price from option chain if we don't have it yet
            if (!spotPrice && item.call_options?.underlying_spot_price) {
                spotPrice = item.call_options.underlying_spot_price;
            }
            if (!spotPrice && item.put_options?.underlying_spot_price) {
                spotPrice = item.put_options.underlying_spot_price;
            }

            // CALL side
            const ce = item.call_options?.market_data;
            if (ce) {
                const iv = (ce.iv || 0) / 100; // Upstox gives IV as percentage
                if (iv > 0.001) {
                    allQuotes.push({
                        strike,
                        expiry: parseFloat(T.toFixed(6)),
                        iv,
                        bid: ce.bid_price || 0,
                        ask: ce.ask_price || 0,
                        volume: ce.volume || 0,
                    });
                }
            }

            // PUT side (for parity checks)
            const pe = item.put_options?.market_data;
            if (pe) {
                const iv = (pe.iv || 0) / 100;
                if (iv > 0.001) {
                    allQuotes.push({
                        strike,
                        expiry: parseFloat(T.toFixed(6)),
                        iv,
                        bid: pe.bid_price || 0,
                        ask: pe.ask_price || 0,
                        volume: pe.volume || 0,
                    });
                }
            }
        }
    }));

    if (!spotPrice) throw new Error('Could not determine spot price. Market may be closed or token may be invalid.');
    
    if (allQuotes.length === 0) {
        // Check if this is an after-hours situation
        const now = new Date();
        const istHour = (now.getUTCHours() + 5) % 24 + (now.getUTCMinutes() + 30 >= 60 ? 1 : 0);
        const marketOpen = istHour >= 9 && istHour < 16; // 9:15 AM to 3:30 PM IST roughly
        if (!marketOpen) {
            throw new Error(
                `Market is currently closed (IST ~${istHour}:${String(now.getUTCMinutes()).padStart(2,'0')}). ` +
                `IV data is only available during market hours (9:15 AM – 3:30 PM IST). ` +
                `Spot price: ₹${spotPrice.toFixed(2)}. Try again during market hours.`
            );
        }
        throw new Error('No valid option quotes with IV data returned.');
    }

    console.log(`[Backend] Collected ${allQuotes.length} quotes across ${targetExpiries.length} expiries, spot=₹${spotPrice}`);

    // 4. Build vol_arb JSON wire format
    return {
        spot: spotPrice,
        riskFreeRate: 0.065,    // ~6.5% INR risk-free rate
        dividendYield: 0.0,
        valuationDate: new Date().toISOString().split('T')[0],
        currency: 'INR',
        quotes: allQuotes,
    };
}

// ── C++ Arbitrage Engine Endpoint ─────────────────────────────────────────────
// ARCHITECTURE:
//   1. Node.js fetches live option chain from Upstox (native HTTPS — no C++ SSL needed)
//   2. Converts data to vol_arb JSON format
//   3. Pipes JSON to C++ via stdin (--stdin --json-output)
//   4. C++ does pure computation (surface build → arbitrage detection → QP correction → profit advisor)
//   5. Node.js returns the C++ JSON output to frontend
app.get('/api/analyze', async (req, res) => {
    const { symbol, exchange = 'NSE_EQ' } = req.query;

    if (!symbol) {
        return res.status(400).json({ success: false, error: 'Symbol parameter is required.' });
    }

    const useMock = process.env.USE_MOCK_DATA === 'true';
    const isMockRequest = symbol === 'MOCK' || useMock;

    if (!process.env.UPSTOX_ACCESS_TOKEN && !isMockRequest) {
        return res.status(500).json({
            success: false,
            error: 'UPSTOX_ACCESS_TOKEN is not configured. Set it in your .env file.',
            hint: 'Copy .env.example to .env and fill in your Upstox access token.'
        });
    }

    console.log(`[Backend] Analyzing ${symbol} (${exchange})...`);

    try {
        let args, stdinData = null;

        if (isMockRequest) {
            // Mock mode: use sample data file
            args = [path.resolve(__dirname, '../vol_arb/data/sample_quotes.json'), '--json-output'];
        } else {
            // Live mode: fetch from Upstox in Node.js, pipe to C++ via stdin
            console.log(`[Backend] Fetching live option chain from Upstox...`);
            const volArbJson = await fetchUpstoxOptionChain(String(symbol), String(exchange));
            stdinData = JSON.stringify(volArbJson);
            args = ['--stdin', '--json-output'];
            console.log(`[Backend] Got ${volArbJson.quotes.length} quotes, spot=${volArbJson.spot}. Sending to C++ engine...`);
        }

        const child = spawn(CPP_EXEC_PATH, args);

        let stdoutData = '';
        let stderrData = '';

        child.stdout.on('data', (data) => { stdoutData += data.toString(); });
        child.stderr.on('data', (data) => { stderrData += data.toString(); });

        // If live mode, write the JSON to stdin
        if (stdinData) {
            child.stdin.write(stdinData);
            child.stdin.end();
        }

        child.on('close', (code) => {
            if (code !== 0) {
                console.error(`[Backend] C++ exited with code ${code}`);
                if (process.env.UPSTOX_DEBUG === 'true') {
                    console.error(`[Backend] STDERR: ${stderrData}`);
                }
                try {
                    return res.status(500).json(JSON.parse(stdoutData));
                } catch {
                    return res.status(500).json({
                        success: false,
                        error: 'Arbitrage engine failed.',
                        details: stderrData || stdoutData
                    });
                }
            }

            try {
                const jsonStart = stdoutData.indexOf('{');
                if (jsonStart === -1) throw new Error('No JSON found in C++ output.');
                const parsed = JSON.parse(stdoutData.substring(jsonStart));
                parsed.success = true;
                parsed.symbol = symbol;
                parsed.exchange = exchange;
                parsed.timestamp = new Date().toISOString();
                console.log(`[Backend] ✓ Analysis complete: ${parsed.violations?.count || 0} violations, ${parsed.trades?.totalRecommendations || 0} trades`);
                res.json(parsed);
            } catch (err) {
                console.error(`[Backend] JSON parse error:`, err.message);
                res.status(500).json({
                    success: false,
                    error: 'Failed to parse C++ output.',
                    details: err.message
                });
            }
        });

        child.on('error', (err) => {
            console.error(`[Backend] Failed to spawn C++ process:`, err);
            res.status(500).json({
                success: false,
                error: 'Failed to start arbitrage engine.',
                details: err.message
            });
        });

    } catch (err) {
        console.error(`[Backend] Upstox fetch error:`, err.message);
        res.status(500).json({
            success: false,
            error: err.message,
            hint: 'Check if the market is open and your Upstox token is valid.'
        });
    }
});

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    const tokenConfigured = !!process.env.UPSTOX_ACCESS_TOKEN &&
        process.env.UPSTOX_ACCESS_TOKEN !== 'ENTER_YOUR_ACCESS_TOKEN_HERE';
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        upstoxTokenConfigured: tokenConfigured,
        mockMode: process.env.USE_MOCK_DATA === 'true',
    });
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    const tokenConfigured = !!process.env.UPSTOX_ACCESS_TOKEN &&
        process.env.UPSTOX_ACCESS_TOKEN !== 'ENTER_YOUR_ACCESS_TOKEN_HERE';

    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║       Vol-Arb Orchestrator Server Started        ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Port:           ${PORT}                              ║`);
    console.log(`║  Upstox Token:   ${tokenConfigured ? '✓ Configured' : '✗ NOT SET (add to .env)'}         ║`);
    console.log(`║  Mock Mode:      ${process.env.USE_MOCK_DATA === 'true' ? 'ON  (set USE_MOCK_DATA=false)' : 'OFF (live API)'}         ║`);
    console.log('║  Docs:           GET /api/health                 ║');
    console.log('╚══════════════════════════════════════════════════╝');
});
