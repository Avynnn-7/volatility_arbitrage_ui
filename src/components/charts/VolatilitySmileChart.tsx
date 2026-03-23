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
  ReferenceLine,
} from 'recharts';
import { ChartContainer } from './ChartContainer';
import { VolatilityTooltip } from './ChartTooltip';
import { useChartExport } from '@/hooks/useChartExport';

interface SmileDataPoint {
  strike: number;
  maturity: number;
  impliedVol: number;
}

interface VolatilitySmileChartProps {
  data: SmileDataPoint[];
  spotPrice: number;
  selectedMaturities?: number[];
  showATM?: boolean;
  className?: string;
  height?: number;
}

// Colors for different maturity curves
const MATURITY_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Green
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export function VolatilitySmileChart({
  data,
  spotPrice,
  selectedMaturities,
  showATM = true,
  className,
  height = 350,
}: VolatilitySmileChartProps) {
  const { exportToPNG, exportToCSV } = useChartExport({ filename: 'volatility-smile' });

  // Group data by maturity
  const { chartData, seriesNames } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], seriesNames: [] };
    }

    // Get unique strikes and maturities
    const strikes = [...new Set(data.map((d) => d.strike))].sort((a, b) => a - b);
    const maturities = [...new Set(data.map((d) => d.maturity))].sort((a, b) => a - b);

    // Filter maturities if specified
    const displayMaturities = selectedMaturities
      ? maturities.filter((m) => selectedMaturities.includes(m))
      : maturities.slice(0, 6); // Limit to 6 for readability

    // Create lookup map
    const dataMap = new Map<string, number>();
    data.forEach((point) => {
      dataMap.set(`${point.strike}-${point.maturity}`, point.impliedVol);
    });

    // Build chart data structure
    const chartData = strikes.map((strike) => {
      const row: Record<string, number> = { strike };
      displayMaturities.forEach((maturity) => {
        const key = `${strike}-${maturity}`;
        const vol = dataMap.get(key);
        if (vol !== undefined) {
          row[`T=${formatMaturity(maturity)}`] = vol;
        }
      });
      return row;
    });

    // Get series names
    const seriesNames = displayMaturities.map((m) => `T=${formatMaturity(m)}`);

    return { chartData, seriesNames };
  }, [data, selectedMaturities]);

  const handleExportPNG = () => {
    exportToPNG('smile-chart');
  };

  const handleExportCSV = () => {
    exportToCSV(chartData as Record<string, unknown>[], ['strike', ...seriesNames]);
  };

  if (chartData.length === 0) {
    return (
      <ChartContainer
        title="Volatility Smile"
        description="Implied volatility across strikes for different maturities"
        className={className}
      >
        <div className="flex h-[350px] items-center justify-center text-surface-400">
          No data available
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer
      title="Volatility Smile"
      description="Implied volatility across strikes for different maturities"
      onExportCSV={handleExportCSV}
      onExportPNG={handleExportPNG}
      className={className}
      id="smile-chart"
    >
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="strike"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              label={{ 
                value: 'Strike', 
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

            {/* ATM reference line */}
            {showATM && (
              <ReferenceLine
                x={spotPrice}
                stroke="#64748b"
                strokeDasharray="5 5"
                label={{ 
                  value: 'ATM', 
                  position: 'top',
                  fill: '#64748b',
                  fontSize: 11,
                }}
              />
            )}

            {/* Lines for each maturity */}
            {seriesNames.map((name, index) => (
              <Line
                key={name}
                type="monotone"
                isAnimationActive={false}
                dataKey={name}
                stroke={MATURITY_COLORS[index % MATURITY_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: MATURITY_COLORS[index % MATURITY_COLORS.length] }}
                activeDot={{ r: 5 }}
                name={name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

function formatMaturity(years: number): string {
  if (years < 1 / 12) return `${Math.round(years * 365)}D`;
  if (years < 1) return `${Math.round(years * 12)}M`;
  return `${years.toFixed(1)}Y`;
}
