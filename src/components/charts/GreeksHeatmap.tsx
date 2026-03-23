import { useState, useMemo } from 'react';
import { scaleSequential } from 'd3-scale';
import { interpolateRdYlGn, interpolateViridis } from 'd3-scale-chromatic';
import { ChartContainer } from './ChartContainer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatNumber, formatMaturity } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type GreekType = 'delta' | 'gamma' | 'theta' | 'vega' | 'rho';

interface GreeksData {
  strike: number;
  maturity: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

interface GreeksHeatmapProps {
  data: GreeksData[];
  className?: string;
}

const GREEK_LABELS: Record<GreekType, string> = {
  delta: 'Delta',
  gamma: 'Gamma',
  theta: 'Theta',
  vega: 'Vega',
  rho: 'Rho',
};

const GREEK_SYMBOLS: Record<GreekType, string> = {
  delta: '\u0394',
  gamma: '\u0393',
  theta: '\u0398',
  vega: '\u03BD',
  rho: '\u03C1',
};

export function GreeksHeatmap({ data, className }: GreeksHeatmapProps) {
  const [selectedGreek, setSelectedGreek] = useState<GreekType>('delta');

  // Organize data into grid
  const { gridData, strikes, maturities, minValue, maxValue } = useMemo(() => {
    if (!data || data.length === 0) {
      return { gridData: [], strikes: [], maturities: [], minValue: 0, maxValue: 1 };
    }

    const strikes = [...new Set(data.map((d) => d.strike))].sort((a, b) => a - b);
    const maturities = [...new Set(data.map((d) => d.maturity))].sort((a, b) => a - b);

    const dataMap = new Map<string, GreeksData>();
    data.forEach((point) => {
      dataMap.set(`${point.strike}-${point.maturity}`, point);
    });

    const gridData: (GreeksData | null)[][] = maturities.map((maturity) =>
      strikes.map((strike) => dataMap.get(`${strike}-${maturity}`) || null)
    );

    // Calculate min/max for selected greek
    const values = data.map((d) => d[selectedGreek]).filter((v) => !isNaN(v));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    return { gridData, strikes, maturities, minValue, maxValue };
  }, [data, selectedGreek]);

  // Color scale
  const colorScale = useMemo(() => {
    // Use diverging colormap for delta (centered at 0.5)
    // Use sequential for others
    if (selectedGreek === 'delta') {
      return scaleSequential(interpolateRdYlGn).domain([0, 1]);
    }
    return scaleSequential(interpolateViridis).domain([minValue, maxValue]);
  }, [selectedGreek, minValue, maxValue]);

  if (data.length === 0) {
    return (
      <ChartContainer
        title="Greeks Heatmap"
        description="Visualize option Greeks across strikes and maturities"
        className={className}
      >
        <div className="flex h-64 items-center justify-center text-surface-400">
          No Greeks data available
        </div>
      </ChartContainer>
    );
  }

  const cellWidth = Math.max(50, Math.min(70, 500 / strikes.length));
  const cellHeight = 36;
  const labelWidth = 60;
  const labelHeight = 28;

  return (
    <ChartContainer
      title="Greeks Heatmap"
      description="Visualize option Greeks across strikes and maturities"
      className={className}
      actions={
        <Select
          value={selectedGreek}
          onValueChange={(v) => setSelectedGreek(v as GreekType)}
        >
          <SelectTrigger className="w-[130px] h-8 bg-surface-700 border-surface-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(GREEK_LABELS) as GreekType[]).map((greek) => (
              <SelectItem key={greek} value={greek}>
                {GREEK_LABELS[greek]} ({GREEK_SYMBOLS[greek]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <TooltipProvider>
        <div className="overflow-x-auto pb-4">
          <svg
            width={labelWidth + strikes.length * cellWidth + 20}
            height={labelHeight + maturities.length * cellHeight + 50}
            className="font-sans"
          >
            {/* Column headers (strikes) */}
            <g transform={`translate(${labelWidth}, 0)`}>
              {strikes.map((strike, i) => (
                <text
                  key={i}
                  x={i * cellWidth + cellWidth / 2}
                  y={labelHeight / 2 + 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[11px] fill-surface-400"
                >
                  ${strike}
                </text>
              ))}
            </g>

            {/* Row headers (maturities) */}
            <g transform={`translate(0, ${labelHeight})`}>
              {maturities.map((maturity, i) => (
                <text
                  key={i}
                  x={labelWidth - 8}
                  y={i * cellHeight + cellHeight / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-[11px] fill-surface-400"
                >
                  {formatMaturity(maturity)}
                </text>
              ))}
            </g>

            {/* Heatmap cells */}
            <g transform={`translate(${labelWidth}, ${labelHeight})`}>
              {gridData.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  if (!cell) return null;

                  const value = cell[selectedGreek];
                  const color = colorScale(value);

                  return (
                    <Tooltip key={`${rowIndex}-${colIndex}`}>
                      <TooltipTrigger asChild>
                        <g transform={`translate(${colIndex * cellWidth}, ${rowIndex * cellHeight})`}>
                          {/* Cell background */}
                          <rect
                            width={cellWidth - 2}
                            height={cellHeight - 2}
                            fill={color}
                            rx={2}
                            className="transition-opacity hover:opacity-80 cursor-pointer"
                          />
                          {/* Cell value */}
                          <text
                            x={cellWidth / 2}
                            y={cellHeight / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[10px] font-medium fill-white pointer-events-none"
                            style={{
                              textShadow: '0 0 3px rgba(0,0,0,0.7)',
                            }}
                          >
                            {formatNumber(value, 3)}
                          </text>
                        </g>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-medium">
                            Strike: ${cell.strike} | {formatMaturity(cell.maturity)}
                          </p>
                          <p>{GREEK_LABELS[selectedGreek]}: {formatNumber(value, 4)}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })
              )}
            </g>

            {/* Color scale legend */}
            <g transform={`translate(${labelWidth}, ${labelHeight + maturities.length * cellHeight + 12})`}>
              <defs>
                <linearGradient id={`heatmap-gradient-${selectedGreek}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  {Array.from({ length: 10 }, (_, i) => i / 9).map((t) => (
                    <stop
                      key={t}
                      offset={`${t * 100}%`}
                      stopColor={colorScale(minValue + t * (maxValue - minValue))}
                    />
                  ))}
                </linearGradient>
              </defs>
              <rect
                width={Math.min(strikes.length * cellWidth - 2, 300)}
                height={12}
                fill={`url(#heatmap-gradient-${selectedGreek})`}
                rx={2}
              />
              <text
                x={0}
                y={26}
                className="text-[10px] fill-surface-400"
              >
                {formatNumber(minValue, 3)}
              </text>
              <text
                x={Math.min(strikes.length * cellWidth - 2, 300)}
                y={26}
                textAnchor="end"
                className="text-[10px] fill-surface-400"
              >
                {formatNumber(maxValue, 3)}
              </text>
            </g>
          </svg>
        </div>
      </TooltipProvider>
    </ChartContainer>
  );
}
