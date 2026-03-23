/**
 * SurfaceColorLegend - Color scale legend for volatility surface
 */

import type { ColorScaleName } from '@/utils/colorScales';
import { getGradientCSSString } from '@/utils/colorScales';
import { formatVolatility } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SurfaceColorLegendProps {
  scale: ColorScaleName;
  minValue: number;
  maxValue: number;
  label?: string;
  className?: string;
  tickCount?: number;
  showRange?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export function SurfaceColorLegend({
  scale,
  minValue,
  maxValue,
  label = 'Implied Volatility',
  className,
  tickCount = 5,
  showRange = true,
  orientation = 'horizontal',
}: SurfaceColorLegendProps) {
  const gradientStyle = getGradientCSSString(scale);
  const ticks = Array.from({ length: tickCount }, (_, i) => i / (tickCount - 1));
  
  if (orientation === 'vertical') {
    return (
      <div className={cn('flex flex-col space-y-2', className)}>
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-stretch space-x-2">
          <div
            className="w-4 rounded flex-1"
            style={{
              background: gradientStyle.replace('to right', 'to top'),
              minHeight: '120px',
            }}
          />
          <div className="flex flex-col justify-between text-xs text-muted-foreground">
            {ticks.reverse().map((t) => (
              <span key={t}>
                {formatVolatility(minValue + (maxValue - minValue) * t)}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn('flex flex-col space-y-2', className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center space-x-2">
        {showRange && (
          <span className="text-xs text-muted-foreground w-14 text-right">
            {formatVolatility(minValue)}
          </span>
        )}
        <div
          className="h-4 flex-1 rounded"
          style={{
            background: gradientStyle,
            minWidth: '150px',
          }}
        />
        {showRange && (
          <span className="text-xs text-muted-foreground w-14">
            {formatVolatility(maxValue)}
          </span>
        )}
      </div>
      <div 
        className={cn(
          'flex justify-between text-xs text-muted-foreground',
          showRange ? 'px-16' : 'px-0'
        )}
      >
        {ticks.map((t) => (
          <span key={t} className="text-center" style={{ width: `${100 / tickCount}%` }}>
            {formatVolatility(minValue + (maxValue - minValue) * t)}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact color legend for small spaces
 */
interface CompactColorLegendProps {
  scale: ColorScaleName;
  minValue: number;
  maxValue: number;
  className?: string;
}

export function CompactColorLegend({
  scale,
  minValue,
  maxValue,
  className,
}: CompactColorLegendProps) {
  const gradientStyle = getGradientCSSString(scale);
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs text-muted-foreground">
        {formatVolatility(minValue)}
      </span>
      <div
        className="h-2 flex-1 rounded-full min-w-[60px]"
        style={{ background: gradientStyle }}
      />
      <span className="text-xs text-muted-foreground">
        {formatVolatility(maxValue)}
      </span>
    </div>
  );
}

export default SurfaceColorLegend;
