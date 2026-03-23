import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { ChartContainer } from './ChartContainer';
import { VolatilityTooltip } from './ChartTooltip';
import { useChartExport } from '@/hooks/useChartExport';
import { formatMaturity } from '@/lib/utils';

interface TermStructureDataPoint {
  strike: number;
  maturity: number;
  impliedVol: number;
}

interface TermStructureChartProps {
  data: TermStructureDataPoint[];
  spotPrice: number;
  selectedStrikes?: number[];
  showRange?: boolean;
  className?: string;
  height?: number;
}

const STRIKE_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Green
];

export function TermStructureChart({
  data,
  spotPrice,
  selectedStrikes,
  showRange = false,
  className,
  height = 350,
}: TermStructureChartProps) {
  const { exportToPNG, exportToCSV } = useChartExport({ filename: 'term-structure' });

  // Group data by strike
  const { chartData, seriesNames } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], seriesNames: [] };
    }

    const maturities = [...new Set(data.map((d) => d.maturity))].sort((a, b) => a - b);
    const strikes = [...new Set(data.map((d) => d.strike))].sort((a, b) => a - b);

    // Select strikes around ATM
    const displayStrikes = selectedStrikes
      ? strikes.filter((s) => selectedStrikes.includes(s))
      : selectATMStrikes(strikes, spotPrice, 5);

    const dataMap = new Map<string, number>();
    data.forEach((point) => {
      dataMap.set(`${point.strike}-${point.maturity}`, point.impliedVol);
    });

    const chartData = maturities.map((maturity) => {
      const row: Record<string, number> = { maturity };
      displayStrikes.forEach((strike) => {
        const key = `${strike}-${maturity}`;
        const vol = dataMap.get(key);
        if (vol !== undefined) {
          row[`K=${strike}`] = vol;
        }
      });

      // Calculate range (min/max) for the maturity if showRange is true
      if (showRange) {
        const vols = displayStrikes
          .map((strike) => dataMap.get(`${strike}-${maturity}`))
          .filter((v): v is number => v !== undefined);
        if (vols.length > 0) {
          row.min = Math.min(...vols);
          row.max = Math.max(...vols);
        }
      }

      return row;
    });

    const seriesNames = displayStrikes.map((s) => `K=${s}`);

    return { chartData, seriesNames };
  }, [data, spotPrice, selectedStrikes, showRange]);

  const handleExportPNG = () => {
    exportToPNG('term-structure-chart');
  };

  const handleExportCSV = () => {
    exportToCSV(chartData as Record<string, unknown>[], ['maturity', ...seriesNames]);
  };

  if (chartData.length === 0) {
    return (
      <ChartContainer
        title="Volatility Term Structure"
        description="Implied volatility across time for different strikes"
        className={className}
      >
        <div className="flex h-[350px] items-center justify-center text-surface-400">
          No data available
        </div>
      </ChartContainer>
    );
  }

  const ChartComponent = showRange ? ComposedChart : LineChart;

  return (
    <ChartContainer
      title="Volatility Term Structure"
      description="Implied volatility across time for different strikes"
      onExportCSV={handleExportCSV}
      onExportPNG={handleExportPNG}
      className={className}
      id="term-structure-chart"
    >
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <ChartComponent data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="maturity"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => formatMaturity(value)}
              label={{ 
                value: 'Maturity', 
                position: 'insideBottom', 
                offset: -15,
                fill: '#94a3b8',
                fontSize: 12,
              }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              label={{ 
                value: 'Implied Vol', 
                angle: -90, 
                position: 'insideLeft',
                fill: '#94a3b8',
                fontSize: 12,
              }}
            />
            <Tooltip content={<VolatilityTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => <span className="text-surface-300">{value}</span>}
            />

            {/* Range area if enabled */}
            {showRange && (
              <>
                <Area
                  type="monotone"
                  dataKey="max"
                  stroke="none"
                  fill="#3B82F6"
                  fillOpacity={0.15}
                  name="Range"
                />
                <Area
                  type="monotone"
                  dataKey="min"
                  stroke="none"
                  fill="#0f172a"
                  fillOpacity={1}
                />
              </>
            )}

            {/* Lines for each strike */}
            {seriesNames.map((name, index) => (
              <Line
                key={name}
                type="monotone"
                isAnimationActive={false}
                dataKey={name}
                stroke={STRIKE_COLORS[index % STRIKE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: STRIKE_COLORS[index % STRIKE_COLORS.length] }}
                activeDot={{ r: 5 }}
                name={name}
              />
            ))}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

// Helper to select strikes around ATM
function selectATMStrikes(strikes: number[], spotPrice: number, count: number): number[] {
  if (strikes.length <= count) return strikes;

  // Find the strike closest to spot
  const atmIndex = strikes.findIndex((s) => s >= spotPrice);
  if (atmIndex === -1) return strikes.slice(0, count);

  // Select strikes around ATM
  const half = Math.floor(count / 2);
  const start = Math.max(0, atmIndex - half);
  const end = Math.min(strikes.length, start + count);

  return strikes.slice(start, end);
}
