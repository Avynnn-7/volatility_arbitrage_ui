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

// ── C++ Arbitrage Engine Endpoint ─────────────────────────────────────────────
// SECURITY FIX: Token is now passed to C++ child process via ENVIRONMENT VARIABLE,
// not as a CLI argument. This prevents the token from appearing in `ps aux` /
// `Get-WmiObject Win32_Process` outputs.
app.get('/api/analyze', (req, res) => {
    const { symbol, exchange = 'NSE_EQ' } = req.query;

    if (!symbol) {
        return res.status(400).json({ success: false, error: 'Symbol parameter is required.' });
    }

    const useMock = process.env.USE_MOCK_DATA === 'true';
    const upstoxToken = process.env.UPSTOX_ACCESS_TOKEN;

    const isMockRequest = symbol === 'MOCK' || useMock;

    if (!upstoxToken && !isMockRequest) {
        return res.status(500).json({
            success: false,
            error: 'UPSTOX_ACCESS_TOKEN is not configured. Set it in your .env file.',
            hint: 'Copy .env.example to .env and fill in your Upstox access token.'
        });
    }

    console.log(`[Backend] Executing C++ analysis for ${symbol} (${exchange})...`);

    // Build the C++ args — NO TOKEN IN ARGS (security fix)
    const args = isMockRequest
        ? [path.resolve(__dirname, '../vol_arb/data/sample_quotes.json'), '--json-output']
        : ['--live', String(symbol), '--exchange', String(exchange), '--json-output'];

    // ✅ SECURE: Token is injected via child process environment, NOT via CLI args.
    // This means it will NOT appear in `ps`, `wmic`, or task manager command lines.
    const childEnv = {
        ...process.env,    // inherit PATH, SystemRoot, etc.
        UPSTOX_ACCESS_TOKEN: upstoxToken || '',
    };

    const child = spawn(CPP_EXEC_PATH, args, { env: childEnv });

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => { stdoutData += data.toString(); });
    child.stderr.on('data', (data) => { stderrData += data.toString(); });

    child.on('close', (code) => {
        if (code !== 0) {
            console.error(`[Backend] C++ process exited with code ${code}`);
            if (process.env.UPSTOX_DEBUG === 'true') {
                console.error(`[Backend] STDERR: ${stderrData}`);
            }
            try {
                const jsonError = JSON.parse(stdoutData);
                return res.status(500).json(jsonError);
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
            console.log(`[Backend] Analysis complete for ${symbol}`);
            res.json(parsed);
        } catch (err) {
            console.error(`[Backend] JSON parse error:`, err.message);
            res.status(500).json({
                success: false,
                error: 'Failed to parse arbitrage results.',
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
