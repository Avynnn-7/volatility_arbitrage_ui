import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { setCurrentSurface } from '@/store/slices/surfaceSlice';
import type { SurfaceData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  FileSpreadsheet, 
  FileJson, 
  Image, 
  FileText,
  CheckCircle,
  RefreshCcw,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatVolatility } from '@/lib/utils';
import type { QuoteInput, ArbitrageOpportunity } from '@/types';

interface AnalysisSummary {
  dataPoints: number;
  strikeCount: number;
  maturityCount: number;
  atmVol: number;
  minVol: number;
  maxVol: number;
  volRange: number;
  violationsFound: number;
  violationsRemoved: number;
  correctionsApplied: boolean;
  avgAdjustment: number;
  maxAdjustment: number;
}

interface Step5ResultsProps {
  parsedQuotes: QuoteInput[];
  spotPrice: number;
  riskFreeRate: number;
  dividendYield: number;
  selectedStrikes: number[];
  selectedMaturities: number[];
  arbitrageResults: ArbitrageOpportunity[];
  correctedSurface?: QuoteInput[];
  qpResult?: {
    iterations: number;
    residual: number;
    violationsRemoved: number;
    maxAdjustment: number;
    avgAdjustment: number;
  };
  onRestart: () => void;
  onBack: () => void;
}

export function Step5Results({
  parsedQuotes,
  spotPrice,
  riskFreeRate,
  dividendYield,
  selectedStrikes,
  selectedMaturities,
  arbitrageResults,
  correctedSurface,
  qpResult,
  onRestart,
  onBack,
}: Step5ResultsProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Calculate the final surface data
  const surfaceData = useMemo(() => {
    return correctedSurface || parsedQuotes.filter(
      (q) => selectedStrikes.includes(q.strike) && selectedMaturities.includes(q.maturity)
    );
  }, [correctedSurface, parsedQuotes, selectedStrikes, selectedMaturities]);

  // Calculate summary statistics
  const summary = useMemo<AnalysisSummary>(() => {
    const strikes = [...new Set(surfaceData.map((d) => d.strike))];
    const maturities = [...new Set(surfaceData.map((d) => d.maturity))];
    const vols = surfaceData.map((d) => d.impliedVol);
    
    // Find ATM vol (closest strike to spot)
    const atmData = surfaceData.filter(
      (d) => Math.abs(d.strike - spotPrice) < spotPrice * 0.05
    );
    const atmVol = atmData.length > 0
      ? atmData.reduce((sum, d) => sum + d.impliedVol, 0) / atmData.length
      : vols.length > 0 ? vols.reduce((a, b) => a + b, 0) / vols.length : 0.2;

    const minVol = Math.min(...vols);
    const maxVol = Math.max(...vols);

    return {
      dataPoints: surfaceData.length,
      strikeCount: strikes.length,
      maturityCount: maturities.length,
      atmVol,
      minVol,
      maxVol,
      volRange: maxVol - minVol,
      violationsFound: arbitrageResults?.length || 0,
      violationsRemoved: qpResult?.violationsRemoved || 0,
      correctionsApplied: !!correctedSurface,
      avgAdjustment: qpResult?.avgAdjustment || 0,
      maxAdjustment: qpResult?.maxAdjustment || 0,
    };
  }, [surfaceData, spotPrice, arbitrageResults, correctedSurface, qpResult]);

  // Dispatch surface to Redux store
  useEffect(() => {
    if (!surfaceData.length) return;
    const strikes = [...new Set(surfaceData.map((d) => d.strike))].sort((a, b) => a - b);
    const expiries = [...new Set(surfaceData.map((d) => d.maturity))].sort((a, b) => a - b);
    
    const ivGrid: number[][] = [];
    for (const expiry of expiries) {
      const row: number[] = [];
      for (const strike of strikes) {
        const point = surfaceData.find((d) => d.strike === strike && d.maturity === expiry);
        row.push(point ? point.impliedVol : 0);
      }
      ivGrid.push(row);
    }

    const surfacePayload: SurfaceData = {
      id: `wz-${Date.now()}`,
      strikes,
      expiries,
      ivGrid,
      stats: {
        minIV: summary.minVol,
        maxIV: summary.maxVol,
        avgIV: summary.atmVol,
        atmIV: summary.atmVol,
        strikeCount: summary.strikeCount,
        expiryCount: summary.maturityCount
      },
      createdAt: new Date().toISOString(),
      marketData: {
        spot: spotPrice,
        riskFreeRate,
        dividendYield,
        valuationDate: new Date().toISOString().split('T')[0],
        currency: 'USD'
      }
    };
    
    dispatch(setCurrentSurface(surfacePayload));
  }, [surfaceData, summary, spotPrice, riskFreeRate, dividendYield, dispatch]);

  // Export to CSV
  const exportCSV = useCallback(async () => {
    setIsExporting('csv');
    try {
      const headers = ['strike', 'maturity', 'impliedVol', 'optionType', 'bid', 'ask', 'mid'];
      const rows = surfaceData.map((row) =>
        [
          row.strike,
          row.maturity,
          row.impliedVol,
          row.optionType || 'call',
          row.bid || '',
          row.ask || '',
          row.mid || '',
        ].join(',')
      );

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Use native download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vol_surface_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error('CSV export error:', error);
    } finally {
      setIsExporting(null);
    }
  }, [surfaceData]);

  // Export to JSON
  const exportJSON = useCallback(async () => {
    setIsExporting('json');
    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          spotPrice,
          riskFreeRate,
          dividendYield,
          correctionApplied: !!correctedSurface,
          summary: {
            dataPoints: summary.dataPoints,
            strikes: summary.strikeCount,
            maturities: summary.maturityCount,
            atmVol: summary.atmVol,
            volRange: [summary.minVol, summary.maxVol],
          },
        },
        surface: surfaceData,
        arbitrageAnalysis: {
          violationsFound: summary.violationsFound,
          violationsRemoved: summary.violationsRemoved,
          violations: arbitrageResults,
        },
        qpCorrection: qpResult
          ? {
              iterations: qpResult.iterations,
              residual: qpResult.residual,
              maxAdjustment: qpResult.maxAdjustment,
              avgAdjustment: qpResult.avgAdjustment,
            }
          : null,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vol_surface_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('JSON exported successfully');
    } catch (error) {
      toast.error('Failed to export JSON');
      console.error('JSON export error:', error);
    } finally {
      setIsExporting(null);
    }
  }, [surfaceData, spotPrice, riskFreeRate, dividendYield, correctedSurface, summary, arbitrageResults, qpResult]);

  // Export PDF report (placeholder)
  const exportReport = useCallback(() => {
    toast.info('PDF report generation coming in Phase 6!');
  }, []);

  // Navigate to 3D surface viewer
  const openSurfaceViewer = useCallback(() => {
    // In production, pass surface data via state or context
    navigate('/surface');
  }, [navigate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-surface-100">Step 5: Results & Export</h2>
        <p className="text-surface-400 mt-1">
          Review your analysis results and download the processed data.
        </p>
      </div>

      {/* Success Banner */}
      <Alert variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Analysis Complete!</AlertTitle>
        <AlertDescription>
          Your volatility surface has been processed successfully.
          {summary.correctionsApplied && ` ${summary.violationsRemoved} arbitrage violations were corrected.`}
        </AlertDescription>
      </Alert>

      {/* Summary Statistics */}
      <Card className="bg-surface-800/50 border-surface-700/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary-400" />
            Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-surface-900/50 border border-surface-700/50">
              <p className="text-sm text-surface-500">Data Points</p>
              <p className="text-2xl font-bold text-surface-100">{summary.dataPoints}</p>
            </div>
            <div className="p-4 rounded-lg bg-surface-900/50 border border-surface-700/50">
              <p className="text-sm text-surface-500">Strikes</p>
              <p className="text-2xl font-bold text-surface-100">{summary.strikeCount}</p>
            </div>
            <div className="p-4 rounded-lg bg-surface-900/50 border border-surface-700/50">
              <p className="text-sm text-surface-500">Maturities</p>
              <p className="text-2xl font-bold text-surface-100">{summary.maturityCount}</p>
            </div>
            <div className="p-4 rounded-lg bg-surface-900/50 border border-surface-700/50">
              <p className="text-sm text-surface-500">ATM Vol</p>
              <p className="text-2xl font-bold text-primary-400">{formatVolatility(summary.atmVol)}</p>
            </div>
          </div>

          <Separator className="bg-surface-700" />

          {/* Market Parameters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-surface-500">Spot Price</p>
              <p className="text-lg font-semibold text-surface-100">${spotPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-surface-500">Risk-Free Rate</p>
              <p className="text-lg font-semibold text-surface-100">{(riskFreeRate * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-surface-500">Vol Range</p>
              <p className="text-lg font-semibold text-surface-100">
                {formatVolatility(summary.minVol)} - {formatVolatility(summary.maxVol)}
              </p>
            </div>
            <div>
              <p className="text-sm text-surface-500">Dividend Yield</p>
              <p className="text-lg font-semibold text-surface-100">{(dividendYield * 100).toFixed(2)}%</p>
            </div>
          </div>

          <Separator className="bg-surface-700" />

          {/* Arbitrage Analysis */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-surface-500">Violations Found</p>
              <Badge 
                variant={summary.violationsFound > 0 ? 'warning' : 'success'}
                className="text-lg mt-1"
              >
                {summary.violationsFound}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-surface-500">Violations Corrected</p>
              <Badge 
                variant={summary.violationsRemoved > 0 ? 'success' : 'secondary'}
                className="text-lg mt-1"
              >
                {summary.violationsRemoved}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-surface-500">QP Correction</p>
              <Badge 
                variant={summary.correctionsApplied ? 'success' : 'outline'}
                className="text-lg mt-1"
              >
                {summary.correctionsApplied ? 'Applied' : 'Skipped'}
              </Badge>
            </div>
            {summary.correctionsApplied && (
              <div>
                <p className="text-sm text-surface-500">Max Adjustment</p>
                <p className="text-lg font-semibold text-surface-100">
                  {formatVolatility(summary.maxAdjustment)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="bg-surface-800/50 border-surface-700/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-primary-400" />
            Export Options
          </CardTitle>
          <CardDescription>
            Download your processed volatility surface in various formats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-3 bg-surface-900/30 border-surface-700/50 hover:bg-surface-800 hover:border-success-500/50"
              onClick={exportCSV}
              disabled={isExporting !== null}
            >
              {isExporting === 'csv' ? (
                <Loader2 className="h-8 w-8 animate-spin text-success-500" />
              ) : (
                <FileSpreadsheet className="h-8 w-8 text-success-500" />
              )}
              <span className="font-medium text-surface-100">Export CSV</span>
              <span className="text-xs text-surface-500">Spreadsheet format</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-3 bg-surface-900/30 border-surface-700/50 hover:bg-surface-800 hover:border-blue-500/50"
              onClick={exportJSON}
              disabled={isExporting !== null}
            >
              {isExporting === 'json' ? (
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              ) : (
                <FileJson className="h-8 w-8 text-blue-500" />
              )}
              <span className="font-medium text-surface-100">Export JSON</span>
              <span className="text-xs text-surface-500">Full metadata</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-3 bg-surface-900/30 border-surface-700/50 hover:bg-surface-800 hover:border-red-500/50 opacity-75"
              onClick={exportReport}
              disabled={isExporting !== null}
            >
              <FileText className="h-8 w-8 text-red-500" />
              <span className="font-medium text-surface-100">PDF Report</span>
              <span className="text-xs text-surface-500">Coming in Phase 6</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-3 bg-surface-900/30 border-surface-700/50 hover:bg-surface-800 hover:border-purple-500/50"
              onClick={openSurfaceViewer}
              disabled={isExporting !== null}
            >
              <Image className="h-8 w-8 text-purple-500" />
              <span className="font-medium text-surface-100">View 3D Surface</span>
              <span className="text-xs text-surface-500">Interactive view</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Preview */}
      {summary.violationsFound > 0 && !summary.correctionsApplied && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Uncorrected Violations</AlertTitle>
          <AlertDescription>
            The exported surface contains {summary.violationsFound} arbitrage violations. 
            Consider going back to apply QP correction for an arbitrage-free surface.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-surface-700">
        <Button variant="outline" onClick={onBack}>
          Back to Correction
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <TrendingUp className="mr-2 h-4 w-4" />
            View Dashboard
          </Button>
          <Button onClick={onRestart}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Start New Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}
