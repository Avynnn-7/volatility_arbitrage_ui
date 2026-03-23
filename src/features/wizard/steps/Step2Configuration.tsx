import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WizardNavigation } from '../WizardNavigation';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/form/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StrikePicker } from '@/components/finance/strike-picker';
import { MaturitySelector } from '@/components/finance/maturity-selector';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info, TrendingUp, Calendar, Settings2 } from 'lucide-react';
import type { QuoteInput } from '@/types';
import { formatVolatility } from '@/lib/utils';

// Validation schema
const configSchema = z.object({
  spotPrice: z.number().positive('Spot price must be positive'),
  riskFreeRate: z.number().min(-0.1, 'Rate must be >= -10%').max(0.5, 'Rate must be <= 50%'),
  dividendYield: z.number().min(0, 'Cannot be negative').max(0.2, 'Must be <= 20%'),
  interpolationMethod: z.enum(['linear', 'cubic', 'spline']),
});

type ConfigFormData = z.infer<typeof configSchema>;

interface Step2ConfigurationProps {
  parsedQuotes: QuoteInput[];
  initialConfig?: {
    spotPrice?: number;
    riskFreeRate?: number;
    dividendYield?: number;
    selectedStrikes?: number[];
    selectedMaturities?: number[];
    interpolationMethod?: 'linear' | 'cubic' | 'spline';
  };
  onComplete: (data: {
    spotPrice: number;
    riskFreeRate: number;
    dividendYield: number;
    selectedStrikes: number[];
    selectedMaturities: number[];
    interpolationMethod: 'linear' | 'cubic' | 'spline';
  }) => void;
  onBack: () => void;
}

export function Step2Configuration({
  parsedQuotes,
  initialConfig,
  onComplete,
  onBack,
}: Step2ConfigurationProps) {
  // Extract unique strikes and maturities from parsed data
  const { availableStrikes, availableMaturities, surfaceStats } = useMemo(() => {
    const strikes = [...new Set(parsedQuotes.map((d) => d.strike))].sort((a, b) => a - b);
    const maturities = [...new Set(parsedQuotes.map((d) => d.maturity))].sort((a, b) => a - b);
    
    // Calculate surface statistics
    const vols = parsedQuotes.map((d) => d.impliedVol);
    const avgVol = vols.reduce((a, b) => a + b, 0) / vols.length;
    const minVol = Math.min(...vols);
    const maxVol = Math.max(...vols);
    
    return {
      availableStrikes: strikes,
      availableMaturities: maturities,
      surfaceStats: {
        avgVol,
        minVol,
        maxVol,
        pointCount: parsedQuotes.length,
      },
    };
  }, [parsedQuotes]);

  // Default spot price to median strike (most likely ATM)
  const defaultSpot = useMemo(() => {
    if (availableStrikes.length === 0) return 100;
    const middleIdx = Math.floor(availableStrikes.length / 2);
    return availableStrikes[middleIdx];
  }, [availableStrikes]);

  // Selected strikes and maturities state
  const [selectedStrikes, setSelectedStrikes] = useState<number[]>(
    initialConfig?.selectedStrikes?.length 
      ? initialConfig.selectedStrikes 
      : availableStrikes
  );
  const [selectedMaturities, setSelectedMaturities] = useState<number[]>(
    initialConfig?.selectedMaturities?.length 
      ? initialConfig.selectedMaturities 
      : availableMaturities
  );

  // Form setup
  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      spotPrice: initialConfig?.spotPrice ?? defaultSpot,
      riskFreeRate: initialConfig?.riskFreeRate ?? 0.05,
      dividendYield: initialConfig?.dividendYield ?? 0,
      interpolationMethod: initialConfig?.interpolationMethod ?? 'cubic',
    },
  });

  const watchSpot = form.watch('spotPrice');

  // Calculate filtered data points based on selection
  const filteredDataCount = useMemo(() => {
    return parsedQuotes.filter(
      (q) => selectedStrikes.includes(q.strike) && selectedMaturities.includes(q.maturity)
    ).length;
  }, [parsedQuotes, selectedStrikes, selectedMaturities]);

  const handleSubmit = useCallback(
    (formData: ConfigFormData) => {
      onComplete({
        ...formData,
        selectedStrikes,
        selectedMaturities,
      });
    },
    [onComplete, selectedStrikes, selectedMaturities]
  );

  // Validation
  const isValid = selectedStrikes.length >= 3 && selectedMaturities.length >= 2;
  const validationMessage = !isValid
    ? `Select at least 3 strikes and 2 maturities (currently: ${selectedStrikes.length} strikes, ${selectedMaturities.length} maturities)`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-surface-100">Step 2: Surface Configuration</h2>
        <p className="text-surface-400 mt-1">
          Configure the volatility surface parameters and select which strikes/maturities to include.
        </p>
      </div>

      {/* Data Summary */}
      <Alert variant="info">
        <Info className="h-4 w-4" />
        <AlertDescription className="flex flex-wrap items-center gap-4">
          <span className="font-medium">Loaded Data:</span>
          <Badge variant="secondary">{surfaceStats.pointCount} points</Badge>
          <Badge variant="secondary">{availableStrikes.length} strikes</Badge>
          <Badge variant="secondary">{availableMaturities.length} maturities</Badge>
          <Badge variant="outline">
            Vol range: {formatVolatility(surfaceStats.minVol)} - {formatVolatility(surfaceStats.maxVol)}
          </Badge>
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Market Parameters */}
          <Card className="bg-surface-800/50 border-surface-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary-400" />
                Market Parameters
              </CardTitle>
              <CardDescription>
                Set the underlying market conditions for pricing calculations.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="spotPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-surface-200">Spot Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="bg-surface-900/50"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          field.onChange(isNaN(val) ? 0 : val);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Current underlying price</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="riskFreeRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-surface-200">Risk-Free Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        className="bg-surface-900/50"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          field.onChange(isNaN(val) ? 0 : val);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Annual rate (e.g., 0.05 = 5%)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dividendYield"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-surface-200">Dividend Yield</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        className="bg-surface-900/50"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          field.onChange(isNaN(val) ? 0 : val);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Annual yield (e.g., 0.02 = 2%)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Interpolation Method */}
          <Card className="bg-surface-800/50 border-surface-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary-400" />
                Interpolation Settings
              </CardTitle>
              <CardDescription>
                Choose the method for interpolating between data points on the surface.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="interpolationMethod"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel className="text-surface-200">Interpolation Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-surface-900/50">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="linear">
                          Linear - Fast, simple interpolation
                        </SelectItem>
                        <SelectItem value="cubic">
                          Cubic Spline - Smooth, C2 continuous
                        </SelectItem>
                        <SelectItem value="spline">
                          B-Spline - Flexible, local control
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Cubic spline is recommended for smooth surfaces.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator className="bg-surface-700" />

          {/* Strike Selection */}
          <Card className="bg-surface-800/50 border-surface-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent-400" />
                Select Strikes
              </CardTitle>
              <CardDescription>
                Choose which strikes to include in the surface analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StrikePicker
                spotPrice={watchSpot || defaultSpot}
                strikes={availableStrikes}
                selectedStrikes={selectedStrikes}
                onStrikesChange={setSelectedStrikes}
              />
            </CardContent>
          </Card>

          {/* Maturity Selection */}
          <Card className="bg-surface-800/50 border-surface-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent-400" />
                Select Maturities
              </CardTitle>
              <CardDescription>
                Choose which maturities (expiration terms) to include.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MaturitySelector
                maturities={availableMaturities}
                selectedMaturities={selectedMaturities}
                onMaturitiesChange={setSelectedMaturities}
              />
            </CardContent>
          </Card>

          {/* Selection Summary */}
          <div className="rounded-lg border border-surface-700 bg-surface-800/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-surface-400">Selected for analysis:</span>
                <Badge 
                  variant={selectedStrikes.length >= 3 ? 'default' : 'destructive'}
                >
                  {selectedStrikes.length} strikes
                </Badge>
                <Badge 
                  variant={selectedMaturities.length >= 2 ? 'default' : 'destructive'}
                >
                  {selectedMaturities.length} maturities
                </Badge>
                <Badge variant="outline">
                  {filteredDataCount} data points
                </Badge>
              </div>
              {validationMessage && (
                <span className="text-sm text-error-400">{validationMessage}</span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <WizardNavigation
            onBack={onBack}
            onNext={form.handleSubmit(handleSubmit)}
            nextDisabled={!isValid || !form.formState.isValid}
            nextLabel="Continue to Detection"
          />
        </form>
      </Form>
    </div>
  );
}
