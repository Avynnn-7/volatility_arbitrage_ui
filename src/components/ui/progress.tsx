import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, variant = 'default', showLabel = false, size = 'md', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-4',
    };
    
    const variantClasses = {
      default: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
    };
    
    return (
      <div className={cn('w-full', className)} {...props}>
        <div
          ref={ref}
          className={cn('w-full overflow-hidden rounded-full bg-secondary', sizeClasses[size])}
        >
          <div
            className={cn(
              'h-full transition-all duration-300 ease-in-out rounded-full',
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <span className="mt-1 text-xs text-muted-foreground">{Math.round(percentage)}%</span>
        )}
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
