import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Minus } from 'lucide-react';
import { formatVolatility, formatPercentage } from '@/lib/utils';
import { cn } from '@/utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = 'default',
  className,
}: MetricCardProps) {
  const variantStyles = {
    default: 'border-surface-700',
    success: 'border-success-500/30 bg-success-500/5',
    warning: 'border-warning-500/30 bg-warning-500/5',
    error: 'border-error-500/30 bg-error-500/5',
  };

  const trendStyles = {
    up: 'text-success-400',
    down: 'text-error-400',
    neutral: 'text-surface-400',
  };

  const TrendIcon = trend?.direction === 'up' 
    ? TrendingUp 
    : trend?.direction === 'down' 
      ? TrendingDown 
      : Minus;

  return (
    <Card className={cn('bg-surface-800/50 border', variantStyles[variant], className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-surface-400">{title}</p>
            <p className="text-2xl font-bold text-surface-100">{value}</p>
            {description && (
              <p className="text-xs text-surface-500">{description}</p>
            )}
          </div>
          {icon && (
            <div className="p-2 rounded-lg bg-surface-700/50">
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 mt-2 text-sm', trendStyles[trend.direction])}>
            <TrendIcon className="h-4 w-4" />
            <span>{trend.value.toFixed(1)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardMetricsProps {
  atmVol: number;
  atmVolChange?: number;
  skew: number;
  violationCount: number;
  coverage: number; // 0-1
}

export function DashboardMetrics({
  atmVol,
  atmVolChange,
  skew,
  violationCount,
  coverage,
}: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* ATM Volatility */}
      <MetricCard
        title="ATM Volatility"
        value={formatVolatility(atmVol)}
        description="At-the-money implied vol"
        icon={<TrendingUp className="h-4 w-4 text-primary-400" />}
        trend={
          atmVolChange !== undefined
            ? {
                value: Math.abs(atmVolChange * 100),
                direction: atmVolChange > 0.001 ? 'up' : atmVolChange < -0.001 ? 'down' : 'neutral',
              }
            : undefined
        }
      />

      {/* Volatility Skew */}
      <MetricCard
        title="Volatility Skew"
        value={formatPercentage(skew)}
        description="25Δ Put - Call IV"
        icon={
          skew < 0 
            ? <TrendingDown className="h-4 w-4 text-error-400" /> 
            : <TrendingUp className="h-4 w-4 text-success-400" />
        }
      />

      {/* Arbitrage Violations */}
      <MetricCard
        title="Arbitrage Violations"
        value={violationCount.toString()}
        description="Calendar & butterfly spreads"
        icon={<AlertTriangle className="h-4 w-4 text-warning-400" />}
        variant={violationCount > 0 ? 'warning' : 'default'}
      />

      {/* Surface Coverage */}
      <MetricCard
        title="Surface Coverage"
        value={formatPercentage(coverage)}
        description="Valid data points"
        icon={<CheckCircle className="h-4 w-4 text-success-400" />}
        variant={coverage >= 0.95 ? 'success' : coverage >= 0.8 ? 'default' : 'warning'}
        trend={{
          value: coverage * 100,
          direction: coverage > 0.95 ? 'up' : coverage > 0.8 ? 'neutral' : 'down',
        }}
      />
    </div>
  );
}
