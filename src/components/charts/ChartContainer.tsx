import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Maximize2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onExport?: () => void;
  onExportCSV?: () => void;
  onExportPNG?: () => void;
  onExpand?: () => void;
  className?: string;
  actions?: React.ReactNode;
  id?: string;
}

export function ChartContainer({
  title,
  description,
  children,
  onExport,
  onExportCSV,
  onExportPNG,
  onExpand,
  className,
  actions,
  id,
}: ChartContainerProps) {
  const hasExportOptions = onExportCSV || onExportPNG;

  return (
    <Card className={cn('bg-surface-800/50 border-surface-700/50', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg text-surface-100">{title}</CardTitle>
            {description && (
              <CardDescription className="text-surface-400">{description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1">
            {actions}
            
            {/* Export dropdown if multiple options */}
            {hasExportOptions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onExportCSV && (
                    <DropdownMenuItem onClick={onExportCSV}>
                      Export CSV
                    </DropdownMenuItem>
                  )}
                  {onExportPNG && (
                    <DropdownMenuItem onClick={onExportPNG}>
                      Export PNG
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Single export button */}
            {onExport && !hasExportOptions && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            )}
            
            {onExpand && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExpand}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent id={id}>{children}</CardContent>
    </Card>
  );
}
