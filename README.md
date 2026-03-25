# ⚡ Volatility Arbitrage Scanner

**Live Site → [volarbui.vercel.app/live](https://volarbui.vercel.app/live)**

A real-time options arbitrage detection engine that scans the NSE/BSE volatility surface for structural mispricings and generates actionable trade recommendations — all from a single hosted web app. No terminal, no downloads, no setup.

![License](https://img.shields.io/badge/license-MIT-blue) ![Deploy](https://img.shields.io/badge/deployed-Vercel-black)

## What It Does

1. **Enter any stock or index** — dynamic autocomplete searches the entire NSE/BSE catalog via Upstox Smart Instrument Search
2. **Fetches live option chain** — spot price, all strikes, up to 3 nearest expiries, real-time bid/ask/IV
3. **Builds the implied volatility surface** — interpolates, extrapolates, and fills gaps
4. **Detects arbitrage violations** — butterfly (convexity), calendar (total variance), monotonicity, and extreme IV violations
5. **Generates trade recommendations** — using actual market bid/ask prices, with correct risk/profit math, lot sizes, breakevens, and risk-reward ratios
6. **Auto-refreshes every 5 seconds** — "Go Live" mode streams updates seamlessly without interrupting the UI

## Key Features

| Feature | Details |
|---|---|
| **Any Stock** | Dynamic search — not limited to a fixed list. Type any NSE/BSE symbol. |
| **F&O Marker** | Stocks without options trading are flagged with a ⚠️ badge in search results. |
| **After-Hours** | Custom Black-Scholes IV solver calculates implied volatility from the last traded price when the market is closed. |
| **Correct Math** | Trade P&L uses actual bid/ask prices. Butterfly maxProfit = spreadWidth − netDebit. Vertical maxRisk accounts for credit received. |
| **Lot Sizes** | Shows profit/risk per NSE lot (e.g., NIFTY=25, RELIANCE=250). |
| **Live Streaming** | 5-second auto-refresh with seamless background updates — no loading flash. |
| **Zero Setup** | Fully hosted on Vercel. API tokens are server-side environment variables. |

## Architecture

```
Browser (React/Vite)
  ↓ fetch every 5s
Vercel Serverless Functions
  ├── /api/search   → Upstox Smart Instrument Search API
  ├── /api/analyze  → Upstox Option Chain + Market Quote APIs
  │     ├── upstox-client.js  (API client + BS IV solver + expiry cache)
  │     └── arbitrage-engine.js  (violation detection + profit advisor)
  └── Static SPA (React UI)
```

**Stack**: React 18, TypeScript, Vite, Vercel Serverless, Upstox v2 API

## Security

- **API tokens are NEVER in the codebase** — stored as encrypted Vercel environment variables
- `.env` files are strictly gitignored (`.env`, `.env.*`, `*.env`)
- All API calls are proxied server-side — tokens never reach the browser

## Development

```bash
npm install
npm run dev        # Local dev server on :5173
```

Create a `.env` file (gitignored) for local development:
```
UPSTOX_ACCESS_TOKEN=your_token_here
```

## Deployment

The app auto-deploys to Vercel on push. To manually deploy:
```bash
npx vercel deploy --prod --yes
```

If the Upstox token expires, update it:
```bash
npx vercel env rm UPSTOX_ACCESS_TOKEN production --yes
npx vercel env add UPSTOX_ACCESS_TOKEN production
npx vercel deploy --prod --yes
```

## License

MIT
