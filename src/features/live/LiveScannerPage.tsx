import { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/common/Spinner';
import { AlertCircle, Zap, TrendingUp, RefreshCw, Server, Wifi } from 'lucide-react';

const API_BASE = 'http://localhost:3001';

export function LiveScannerPage() {
  const [symbol, setSymbol] = useState('NIFTY');
  const [exchange, setExchange] = useState('NSE_INDEX');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Check backend connectivity on mount
  const checkBackend = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        setBackendOnline(true);
        return data;
      }
      setBackendOnline(false);
    } catch {
      setBackendOnline(false);
    }
    return null;
  }, []);

  useEffect(() => { checkBackend(); }, [checkBackend]);

  const handleScan = async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/analyze?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}`,
        { signal: AbortSignal.timeout(30000) }
      );
      const data = await response.json();
      
      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Failed to analyze live data');
      }
      
      setResult(data);
      setBackendOnline(true);
    } catch (err: any) {
      if (err.name === 'TypeError' || err.name === 'AbortError') {
        setBackendOnline(false);
        setError('Cannot connect to the backend server. Make sure it is running (npm run server).');
      } else {
        setError(err.message || 'An error occurred during live scan.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Live Arbitrage Scanner"
      description="Real-time volatility arbitrage detection using Upstox API"
      fullWidth
    >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Backend connectivity status */}
        {backendOnline === false && (
          <Card className="bg-amber-500/5 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Server className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-300 mb-1">Backend Server Required</h4>
                  <p className="text-sm text-surface-300 mb-3">
                    The Live Scanner connects to a local backend server that securely communicates with the Upstox API.
                    Start the server to use real-time analysis:
                  </p>
                  <div className="bg-surface-900 rounded-lg p-3 font-mono text-sm">
                    <p className="text-surface-400"># In the vol_arb_ui directory:</p>
                    <p className="text-primary-400">npm run server</p>
                  </div>
                  <p className="text-xs text-surface-500 mt-2">
                    The server runs on port 3001 and handles Upstox API authentication securely.
                    Your API token stays server-side and is never exposed to the browser.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={checkBackend}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Retry Connection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {backendOnline === true && (
          <div className="flex items-center gap-2 text-xs text-success-400 px-1">
            <Wifi className="h-3 w-3" />
            <span>Backend connected — real-time data ready</span>
          </div>
        )}
        
        {/* Scanner Controls */}
        <Card className="bg-surface-800/50 border-surface-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent-400" />
              Live Scan Configuration
            </CardTitle>
            <CardDescription>Enter a valid NSE or BSE symbol to analyze</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-2 flex-1">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., RELIANCE, NIFTY"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label>Exchange</Label>
                <Select value={exchange} onValueChange={setExchange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exchange" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NSE_EQ">NSE Equity (NSE_EQ)</SelectItem>
                    <SelectItem value="NSE_INDEX">NSE Index (NSE_INDEX)</SelectItem>
                    <SelectItem value="BSE_EQ">BSE Equity (BSE_EQ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleScan} 
                disabled={loading || !symbol}
                className="btn-primary w-full md:w-auto min-w-[120px]"
              >
                {loading ? <Spinner size="sm" className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {loading ? 'Scanning...' : 'Scan Now'}
              </Button>
            </div>
            
            {error && (
              <div className="mt-4 p-4 rounded-md bg-danger-500/10 border border-danger-500/20 text-danger-400 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">Scan Error</h4>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {loading && (
          <div className="p-12 text-center text-surface-400">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p>Fetching option chain and detecting violations...</p>
          </div>
        )}

        {result && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Market Info */}
            <Card className="bg-surface-800/50 border-surface-700/50">
              <CardHeader>
                <CardTitle>Market Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-surface-900 border border-surface-700/50">
                    <p className="text-sm text-surface-400">Spot Price</p>
                    <p className="text-2xl font-bold text-surface-100">
                      ₹{result.market?.spot?.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-surface-900 border border-surface-700/50">
                    <p className="text-sm text-surface-400">Quotes Processed</p>
                    <p className="text-2xl font-bold text-surface-100">
                      {result.market?.quotesCount}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-surface-900 border border-surface-700/50">
                    <p className="text-sm text-surface-400">Violations Detected</p>
                    <p className={`text-2xl font-bold ${result.violations?.count > 0 ? 'text-warning-400' : 'text-success-400'}`}>
                      {result.violations?.count}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-surface-900 border border-surface-700/50">
                    <p className="text-sm text-surface-400">Correction L2 Cost</p>
                    <p className="text-2xl font-bold text-primary-400">
                      {result.correction?.l2Cost?.toFixed(4) || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profit Advisor Suggestions */}
            <Card className="bg-surface-800/50 border-surface-700/50 lg:row-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success-400" />
                  Profit Advisor Suggestions
                </CardTitle>
                <CardDescription>Actionable trades derived from arbitrage detection</CardDescription>
              </CardHeader>
              <CardContent>
                {result.trades?.recommendations && result.trades.recommendations.length > 0 ? (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {result.trades.recommendations.map((trade: any, i: number) => (
                      <div key={i} className="p-4 rounded-lg bg-surface-900 border border-surface-700/50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="inline-block px-2 py-1 bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded text-xs font-medium mb-2">
                              {trade.strategyType}
                            </span>
                            <h4 className="font-semibold text-lg">{trade.description}</h4>
                          </div>
                          {trade.severity === 'CRITICAL' && (
                            <span className="px-2 py-1 bg-danger-500/20 text-danger-400 rounded text-xs font-bold animate-pulse">
                              URGENT
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                          <div className="flex justify-between p-2 bg-surface-800 rounded">
                            <span className="text-surface-400">Est. Profit:</span>
                            <span className="text-success-400 font-bold">₹{trade.estimatedProfit.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-surface-800 rounded">
                            <span className="text-surface-400">Max Risk:</span>
                            <span className="text-warning-400 font-bold">₹{trade.maxRisk.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-surface-800 rounded">
                            <span className="text-surface-400">Net Premium:</span>
                            <span className="text-surface-200 font-semibold">₹{trade.netPremium.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs text-surface-400 mb-2 font-semibold">LEGS TO EXECUTE:</p>
                          <ul className="space-y-1">
                            {trade.legs.map((leg: any, j: number) => (
                              <li key={j} className="text-sm flex justify-between">
                                <span className={leg.action === 'BUY' ? 'text-success-400 font-medium' : 'text-danger-400 font-medium'}>
                                  {leg.action} {leg.quantity}x
                                </span>
                                <span>{leg.optionType} @ {leg.strike}</span>
                                <span className="text-surface-400 font-mono">₹{leg.price.toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-surface-400">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No actionable arbitrage trades found.</p>
                    <p className="text-sm mt-1">Market is currently efficient here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Raw Violations Summary */}
            <Card className="bg-surface-800/50 border-surface-700/50">
              <CardHeader>
                <CardTitle>Raw Violations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {result.violations?.items?.length > 0 ? (
                    result.violations.items.map((v: any, i: number) => (
                      <div key={i} className="text-sm p-2 rounded bg-surface-900 border border-surface-700 flex justify-between items-center">
                        <span className="text-surface-300 font-mono text-xs">{v.type}</span>
                        <span className="text-surface-100">{v.description}</span>
                        <span className={v.critical ? 'text-danger-400 font-bold' : 'text-warning-400'}>
                          {v.severity.toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-surface-400 py-4">No structural violations found.</p>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </PageLayout>
  );
}
