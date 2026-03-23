import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircle, Info, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        info: 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400 [&>svg]:text-blue-500',
        success: 'border-success/50 bg-success/10 text-green-600 dark:text-green-400 [&>svg]:text-success',
        warning: 'border-warning/50 bg-warning/10 text-yellow-600 dark:text-yellow-400 [&>svg]:text-warning',
        destructive: 'border-destructive/50 bg-destructive/10 text-red-600 dark:text-red-400 [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const alertIcons = {
  default: Info,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  destructive: XCircle,
};

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  showIcon?: boolean;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', showIcon = true, children, ...props }, ref) => {
    const Icon = alertIcons[variant || 'default'];
    
    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        {showIcon && <Icon className="h-4 w-4" />}
        {children}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
  )
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
