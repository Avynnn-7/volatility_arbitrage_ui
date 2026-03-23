import { cn, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

interface GreeksDisplayProps {
  greeks: Greeks;
  compact?: boolean;
  showDescriptions?: boolean;
  className?: string;
}

const greekDescriptions = {
  delta: 'Rate of change of option price with respect to underlying price',
  gamma: 'Rate of change of delta with respect to underlying price',
  theta: 'Rate of change of option price with respect to time (per day)',
  vega: 'Rate of change of option price with respect to volatility (per 1%)',
  rho: 'Rate of change of option price with respect to interest rate (per 1%)',
};

const greekColors = {
  delta: 'text-blue-500',
  gamma: 'text-purple-500',
  theta: 'text-orange-500',
  vega: 'text-green-500',
  rho: 'text-pink-500',
};

export function GreeksDisplay({
  greeks,
  compact = false,
  showDescriptions = true,
  className,
}: GreeksDisplayProps) {
  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-4', className)}>
        {Object.entries(greeks).map(([key, value]) => (
          <div key={key} className="flex items-center space-x-1">
            <span className={cn('font-medium capitalize', greekColors[key as keyof Greeks])}>
              {key === 'theta' ? 'Θ' : key === 'gamma' ? 'Γ' : key === 'delta' ? 'Δ' : key === 'vega' ? 'V' : 'ρ'}:
            </span>
            <span className="font-mono text-sm">{formatNumber(value, 4)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Option Greeks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Object.entries(greeks).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center space-x-1">
                <span className={cn('text-sm font-medium capitalize', greekColors[key as keyof Greeks])}>
                  {key}
                </span>
                {showDescriptions && (
                  <SimpleTooltip content={greekDescriptions[key as keyof Greeks]}>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </SimpleTooltip>
                )}
              </div>
              <p className="font-mono text-lg font-semibold">{formatNumber(value, 4)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
