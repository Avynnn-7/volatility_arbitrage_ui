import type { TooltipProps } from 'recharts';
import { formatNumber, formatVolatility, formatCurrency } from '@/lib/utils';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color?: string;
  }>;
  label?: string | number;
  formatValue?: (value: number) => string;
  labelFormatter?: (label: string) => string;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatValue = formatNumber,
  labelFormatter = (l) => String(l),
  valuePrefix = '',
  valueSuffix = '',
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800 p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-surface-100">{labelFormatter(String(label))}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-surface-400">{entry.name}:</span>
            </div>
            <span className="font-mono font-medium text-surface-100">
              {valuePrefix}
              {formatValue(entry.value as number)}
              {valueSuffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Volatility-specific tooltip
export function VolatilityTooltip(props: TooltipProps<number, string>) {
  return (
    <ChartTooltip 
      active={props.active}
      payload={props.payload as CustomTooltipProps['payload']}
      label={props.label}
      formatValue={(v) => formatVolatility(v)} 
    />
  );
}

// Currency-specific tooltip
export function CurrencyTooltip(props: TooltipProps<number, string>) {
  return (
    <ChartTooltip 
      active={props.active}
      payload={props.payload as CustomTooltipProps['payload']}
      label={props.label}
      formatValue={(v) => formatCurrency(v)} 
    />
  );
}

// Percentage tooltip
export function PercentageTooltip(props: TooltipProps<number, string>) {
  return (
    <ChartTooltip 
      active={props.active}
      payload={props.payload as CustomTooltipProps['payload']}
      label={props.label}
      formatValue={(v) => `${(v * 100).toFixed(2)}%`} 
    />
  );
}
