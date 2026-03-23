import { useState, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RefreshCcw, Download, AlertCircle } from 'lucide-react';
import { DashboardMetrics } from './DashboardMetrics';
import { DashboardCharts } from './DashboardCharts';
import { toast } from 'sonner';
import type { ArbitrageOpportunity } from '@/types';

// Generate mock data for development
function generateMockDashboardData() {
  const strikes = [80, 85, 90, 95, 100, 105, 110, 115, 120];
  const maturities = [0.083, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0];

  const surfaceData: Array<{ strike: number; maturity: number; impliedVol: number }> = [];
  const greeksData: Array<{
    strike: number;
    maturity: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  }> = [];

  for (const strike of strikes) {
    for (const maturity of maturities) {
      const moneyness = Math.log(strike / 100);
      const baseVol = 0.2;
      const skew = -0.1 * moneyness;
      const smile = 0.02 * moneyness * moneyness;
      const termStructure = 0.01 * Math.sqrt(maturity);
      const impliedVol = baseVol + skew + smile + termStructure + Math.random() * 0.01;

      surfaceData.push({ strike, maturity, impliedVol });

      // Mock Greeks
      greeksData.push({
        strike,
        maturity,
        delta: strike < 100 ? 0.3 + Math.random() * 0.2 : 0.6 + Math.random() * 0.2,
        gamma: 0.01 + Math.random() * 0.02,
        theta: -0.02 - Math.random() * 0.01,
        vega: 0.15 + Math.random() * 0.1,
        rho: 0.05 + Math.random() * 0.05,
      });
    }
  }

  // Mock arbitrage opportunities
  const arbitrageData = [
    {
      id: '1',
      type: 'calendar' as const,
      strike1: 100,
      maturity1: 0.25,
      maturity2: 0.5,
      severity: 0.75,
      expectedProfit: 12.5,
      description: 'Near-term vol higher than far-term',
    },
    {
      id: '2',
      type: 'butterfly' as const,
      strike1: 95,
      strike2: 100,
      strike3: 105,
      maturity1: 0.5,
      severity: 0.45,
      expectedProfit: 8.2,
      description: 'Convexity violation in smile',
    },
  ];

  return { surfaceData, greeksData, arbitrageData };
}

export function DashboardPage() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Generate mock data - in production, use real data fetching hooks
  const mockData = useMemo(() => generateMockDashboardData(), []);
  
  const { surfaceData, greeksData, arbitrageData } = mockData;

  const handleRefresh = async () => {
    setIsLoading(true);
    toast.info('Refreshing dashboard data...');
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setLastUpdated(new Date());
    setIsLoading(false);
    toast.success('Dashboard refreshed');
  };

  const handleExportReport = () => {
    toast.info('Report export coming soon!');
  };

  // Calculate metrics from surface data
  const metrics = useMemo(() => {
    // Find ATM vol (strike closest to 100)
    const atmData = surfaceData.filter((d) => d.strike === 100);
    const atmVol = atmData.length > 0
      ? atmData.reduce((sum, d) => sum + d.impliedVol, 0) / atmData.length
      : 0.2;

    // Calculate skew (difference between 25-delta put and call vol, approximated)
    const otmPutData = surfaceData.filter((d) => d.strike === 90);
    const otmCallData = surfaceData.filter((d) => d.strike === 110);
    const otmPutVol = otmPutData.length > 0
      ? otmPutData.reduce((sum, d) => sum + d.impliedVol, 0) / otmPutData.length
      : 0.22;
    const otmCallVol = otmCallData.length > 0
      ? otmCallData.reduce((sum, d) => sum + d.impliedVol, 0) / otmCallData.length
      : 0.19;
    const skew = otmPutVol - otmCallVol;

    // Coverage (valid data points / total possible)
    const coverage = surfaceData.length / (9 * 7); // strikes * maturities

    return {
      atmVol,
      atmVolChange: 0.012, // Mock change
      skew,
      violationCount: arbitrageData.length,
      coverage,
    };
  }, [surfaceData, arbitrageData]);

  const handleArbitrageClick = (opportunity: ArbitrageOpportunity) => {
    toast.info(`Selected: ${opportunity.type} arbitrage at strike ${opportunity.strike1 ?? 'N/A'}`);
  };

  return (
    <PageLayout
      title="Dashboard"
      description="Real-time volatility surface analytics"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-surface-400">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </span>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isLoading}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Key Metrics */}
        <DashboardMetrics {...metrics} />

        {/* Alerts */}
        {arbitrageData.length > 0 && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Arbitrage Violations Detected</AlertTitle>
            <AlertDescription>
              {arbitrageData.length} violation{arbitrageData.length > 1 ? 's' : ''} found. 
              Review the opportunities table below for details.
            </AlertDescription>
          </Alert>
        )}

        {/* Charts Grid */}
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-surface-400">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <DashboardCharts
            surfaceData={surfaceData}
            greeksData={greeksData}
            arbitrageData={arbitrageData}
            spotPrice={100}
            onArbitrageClick={handleArbitrageClick}
          />
        )}
      </div>
    </PageLayout>
  );
}
