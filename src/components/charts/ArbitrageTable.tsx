import { useMemo } from 'react';
import { ChartContainer } from './ChartContainer';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatMaturity } from '@/lib/utils';
import { ArrowDownUp, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ArbitrageOpportunity } from '@/types';

export type ArbitrageType = 'calendar' | 'butterfly' | 'vertical';

// Re-export for convenience
export type { ArbitrageOpportunity };

interface ArbitrageTableProps {
  opportunities: ArbitrageOpportunity[];
  onRowClick?: (opportunity: ArbitrageOpportunity) => void;
  className?: string;
  maxRows?: number;
}

const TYPE_ICONS: Record<ArbitrageType, React.ElementType> = {
  calendar: Calendar,
  butterfly: TrendingUp,
  vertical: ArrowDownUp,
};

const SEVERITY_STYLES = {
  high: {
    badge: 'bg-error-500/20 text-error-400 border-error-500/30',
    row: 'bg-error-500/5',
  },
  medium: {
    badge: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
    row: 'bg-warning-500/5',
  },
  low: {
    badge: 'bg-success-500/20 text-success-400 border-success-500/30',
    row: '',
  },
};

export function ArbitrageTable({
  opportunities,
  onRowClick,
  className,
  maxRows = 10,
}: ArbitrageTableProps) {
  const displayData = useMemo(() => {
    return opportunities.slice(0, maxRows);
  }, [opportunities, maxRows]);

  const getSeverityLevel = (severity: number): 'high' | 'medium' | 'low' => {
    if (severity > 0.66) return 'high';
    if (severity > 0.33) return 'medium';
    return 'low';
  };

  const formatStrikes = (opp: ArbitrageOpportunity): string => {
    if (!opp.strike1) return '-';
    if (opp.strike3) {
      return `${formatCurrency(opp.strike1)} / ${formatCurrency(opp.strike2!)} / ${formatCurrency(opp.strike3)}`;
    }
    if (opp.strike2) {
      return `${formatCurrency(opp.strike1)} / ${formatCurrency(opp.strike2)}`;
    }
    return formatCurrency(opp.strike1);
  };

  const formatMaturities = (opp: ArbitrageOpportunity): string => {
    if (!opp.maturity1) return '-';
    if (opp.maturity2) {
      return `${formatMaturity(opp.maturity1)} / ${formatMaturity(opp.maturity2)}`;
    }
    return formatMaturity(opp.maturity1);
  };

  return (
    <ChartContainer
      title="Arbitrage Opportunities"
      description={`${opportunities.length} violation${opportunities.length !== 1 ? 's' : ''} detected`}
      className={className}
    >
      {opportunities.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center text-center">
          <AlertTriangle className="h-8 w-8 text-success-500 mb-2" />
          <p className="text-surface-400">No arbitrage violations detected</p>
          <p className="text-sm text-surface-500">The surface is arbitrage-free</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="px-3 py-2 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Strike(s)
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Maturity
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Est. Profit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {displayData.map((opp) => {
                const severityLevel = getSeverityLevel(opp.severity);
                const Icon = TYPE_ICONS[opp.type];
                const styles = SEVERITY_STYLES[severityLevel];

                return (
                  <tr
                    key={opp.id}
                    onClick={() => onRowClick?.(opp)}
                    className={cn(
                      'transition-colors',
                      styles.row,
                      onRowClick && 'cursor-pointer hover:bg-surface-700/30'
                    )}
                  >
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Badge variant="outline" className="gap-1 border-surface-600">
                        <Icon className="h-3 w-3" />
                        <span className="capitalize">{opp.type}</span>
                      </Badge>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-surface-200 font-mono">
                      {formatStrikes(opp)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-surface-300">
                      {formatMaturities(opp)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Badge className={cn('border', styles.badge)}>
                        {severityLevel === 'high' ? 'High' : severityLevel === 'medium' ? 'Medium' : 'Low'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right">
                      {opp.expectedProfit ? (
                        <span className="font-mono text-sm text-success-400">
                          +{formatCurrency(opp.expectedProfit)}
                        </span>
                      ) : (
                        <span className="text-surface-500">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {opportunities.length > maxRows && (
            <div className="px-3 py-2 text-center text-sm text-surface-500 border-t border-surface-700">
              Showing {maxRows} of {opportunities.length} violations
            </div>
          )}
        </div>
      )}
    </ChartContainer>
  );
}
