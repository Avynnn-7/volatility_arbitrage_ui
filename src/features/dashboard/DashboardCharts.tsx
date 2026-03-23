import { VolatilitySmileChart } from '@/components/charts/VolatilitySmileChart';
import { TermStructureChart } from '@/components/charts/TermStructureChart';
import { ArbitrageTable, type ArbitrageOpportunity } from '@/components/charts/ArbitrageTable';
import { GreeksHeatmap } from '@/components/charts/GreeksHeatmap';

interface SurfaceDataPoint {
  strike: number;
  maturity: number;
  impliedVol: number;
}

interface GreeksDataPoint {
  strike: number;
  maturity: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

interface DashboardChartsProps {
  surfaceData: SurfaceDataPoint[];
  greeksData: GreeksDataPoint[];
  arbitrageData: ArbitrageOpportunity[];
  spotPrice: number;
  onArbitrageClick?: (opportunity: ArbitrageOpportunity) => void;
}

export function DashboardCharts({
  surfaceData,
  greeksData,
  arbitrageData,
  spotPrice,
  onArbitrageClick,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Top row - Smile and Term Structure */}
      <VolatilitySmileChart
        data={surfaceData}
        spotPrice={spotPrice}
      />
      <TermStructureChart
        data={surfaceData}
        spotPrice={spotPrice}
        showRange
      />

      {/* Bottom row - Arbitrage and Greeks */}
      <ArbitrageTable 
        opportunities={arbitrageData}
        onRowClick={onArbitrageClick}
      />
      <GreeksHeatmap data={greeksData} />
    </div>
  );
}
