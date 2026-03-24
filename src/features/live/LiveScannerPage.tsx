import { useState, useRef, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/common/Spinner';
import { AlertCircle, Zap, TrendingUp, RefreshCw, Clock, Activity, Search } from 'lucide-react';

// Auto-detect: use relative URL on Vercel, localhost for local dev
const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  instrumentKey: string;
  instrumentType: string;
}

export function LiveScannerPage() {
  const [symbol, setSymbol] = useState('NIFTY');
  const [exchange, setExchange] = useState('NSE_INDEX');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState('NIFTY');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const searchInstruments = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(data.results || []);
      setShowDropdown(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    const upper = value.toUpperCase();
    setSearchQuery(upper);
    setSymbol(upper);
    
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => searchInstruments(upper), 250);
  };

  const selectSuggestion = (s: SearchResult) => {
    setSymbol(s.symbol);
    setSearchQuery(s.symbol);
    // Auto-set exchange based on selection
    if (s.exchange === 'NSE_EQ' || s.exchange === 'BSE_EQ') {
      setExchange(s.exchange);
    }
    setShowDropdown(false);
    setSuggestions([]);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleScan = async () => {
    if (!symbol) return;
    setShowDropdown(false);
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
    } catch (err: any) {
      if (err.name === 'TypeError') {
        setError('Cannot connect to the analysis server. Please try again in a moment.');
      } else if (err.name === 'AbortError') {
        setError('Request timed out. The market data server may be busy. Please retry.');
      } else {
        setError(err.message || 'An error occurred during live scan.');
      }
    } finally {
      setLoading(false);
    }
  };

  // IST market hours check
  const now = new Date();
  const istOffset = 5.5 * 60;
  const istMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes()) + istOffset;
  const istHour = Math.floor((istMinutes % (24 * 60)) / 60);
  const istMin = Math.floor(istMinutes % 60);
  const marketOpen = (istHour > 9 || (istHour === 9 && istMin >= 15)) && (istHour < 15 || (istHour === 15 && istMin <= 30));

  return (
    <PageLayout
      title="Live Arbitrage Scanner"
      description="Real-time volatility arbitrage detection powered by Upstox API"
      fullWidth
    >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Market Status Banner */}
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
          marketOpen 
            ? 'text-success-400 bg-success-500/5 border-success-500/20' 
            : 'text-amber-400 bg-amber-500/5 border-amber-500/20'
        }`}>
          {marketOpen ? <Activity className="h-3 w-3 animate-pulse" /> : <Clock className="h-3 w-3" />}
          <span>
            {marketOpen 
              ? 'NSE Market is OPEN — Live IV data available' 
              : `NSE Market is CLOSED (IST ${istHour}:${String(istMin).padStart(2,'0')}) — IV data available 9:15 AM – 3:30 PM IST`}
          </span>
        </div>
        
        {/* Scanner Controls */}
        <Card className="bg-surface-800/50 border-surface-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent-400" />
              Live Scan Configuration
            </CardTitle>
            <CardDescription>Search any NSE/BSE stock or index — type to search all available instruments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              {/* Symbol search with autocomplete */}
              <div className="space-y-2 flex-1 relative" ref={dropdownRef}>
                <Label htmlFor="symbol-search">
                  <Search className="h-3 w-3 inline mr-1" />
                  Symbol
                </Label>
                <div className="relative">
                  <input
                    id="symbol-search"
                    type="text"
                    placeholder="Type to search... e.g., RELIANCE, TATAMOTORS, NIFTY"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setShowDropdown(false); handleScan(); } }}
                    className="w-full px-3 py-2 rounded-md text-white bg-surface-900 border border-surface-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none placeholder:text-surface-500 font-medium text-sm"
                    autoComplete="off"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Spinner size="sm" />
                    </div>
                  )}
                </div>

                {/* Autocomplete dropdown */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-surface-900 border border-surface-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <button
                        key={`${s.symbol}-${s.exchange}-${i}`}
                        onClick={() => selectSuggestion(s)}
                        className="w-full px-3 py-2.5 text-left hover:bg-surface-700/50 flex items-center justify-between border-b border-surface-800 last:border-b-0 transition-colors"
                      >
                        <div>
                          <span className="font-semibold text-white text-sm">{s.symbol}</span>
                          <span className="text-surface-400 text-xs ml-2">{s.name}</span>
                        </div>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-surface-800 text-surface-400 font-mono">
                          {s.exchange}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <Label>Exchange</Label>
                <Select value={exchange} onValueChange={setExchange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exchange" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NSE_EQ">NSE Equity</SelectItem>
                    <SelectItem value="NSE_INDEX">NSE Index</SelectItem>
                    <SelectItem value="BSE_EQ">BSE Equity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleScan} 
                disabled={loading || !symbol}
                className="btn-primary w-full md:w-auto min-w-[140px]"
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
            <p className="text-lg font-medium">Fetching live option chain from Upstox...</p>
            <p className="text-sm mt-1 text-surface-500">Analyzing volatility surface for arbitrage violations</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-6">

            {/* Latency & Engine Info */}
            <div className="flex flex-wrap gap-3 text-xs text-surface-500">
              <span className="px-2 py-1 rounded bg-surface-800 border border-surface-700">
                Engine: {result.engine === 'js-serverless' ? '⚡ JS Serverless' : '🔧 C++ Native'}
              </span>
              {result.computeTimeMs != null && (
                <span className="px-2 py-1 rounded bg-surface-800 border border-surface-700">
                  Compute: {result.computeTimeMs}ms
                </span>
              )}
              {result.totalLatencyMs != null && (
                <span className="px-2 py-1 rounded bg-surface-800 border border-surface-700">
                  Total: {result.totalLatencyMs}ms
                </span>
              )}
              <span className="px-2 py-1 rounded bg-surface-800 border border-surface-700">
                {result.symbol} ({result.exchange})
              </span>
            </div>

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
                        ₹{result.market?.spot?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      <p className="text-sm text-surface-400">Trade Opportunities</p>
                      <p className={`text-2xl font-bold ${result.trades?.totalRecommendations > 0 ? 'text-primary-400' : 'text-surface-400'}`}>
                        {result.trades?.totalRecommendations || 0}
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
                    Profit Advisor
                  </CardTitle>
                  <CardDescription>Actionable trades derived from arbitrage violations</CardDescription>
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
                            <div className="flex justify-between p-2 bg-surface-800 rounded">
                              <span className="text-surface-400">Urgency:</span>
                              <span className={`font-semibold ${
                                trade.severity === 'CRITICAL' ? 'text-danger-400' : 
                                trade.severity === 'HIGH' ? 'text-warning-400' : 'text-surface-300'
                              }`}>{trade.urgency}</span>
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
                      <p className="text-sm mt-1">Market is currently efficient for this instrument.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Raw Violations Summary */}
              <Card className="bg-surface-800/50 border-surface-700/50">
                <CardHeader>
                  <CardTitle>Detected Violations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {result.violations?.items?.length > 0 ? (
                      result.violations.items.map((v: any, i: number) => (
                        <div key={i} className="text-sm p-2 rounded bg-surface-900 border border-surface-700 flex justify-between items-center">
                          <span className="text-surface-300 font-mono text-xs">{v.type}</span>
                          <span className="text-surface-100 flex-1 mx-3 truncate">{v.description}</span>
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
          </div>
        )}
      </div>
    </PageLayout>
  );
}
