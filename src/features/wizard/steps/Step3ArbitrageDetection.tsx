import { useState, useCallback, useMemo } from 'react';
import { WizardNavigation } from '../WizardNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ArbitrageTable } from '@/components/charts/ArbitrageTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Calendar, 
  TrendingUp, 
  GitBranch,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import type { QuoteInput, ArbitrageOpportunity } from '@/types';

interface ArbitrageSettings {
  checkCalendar: boolean;
  checkButterfly: boolean;
  checkVertical: boolean;
  toleranceCalendar: number;
  toleranceButterfly: number;
  toleranceVertical: number;
}

interface Step3ArbitrageDetectionProps {
  parsedQuotes: QuoteInput[];
  spotPrice: number;
  selectedStrikes: number[];
  selectedMaturities: number[];
  initialResults?: ArbitrageOpportunity[];
  initialSettings?: ArbitrageSettings;
  onComplete: (data: {
    arbitrageSettings: ArbitrageSettings;
    arbitrageResults: ArbitrageOpportunity[];
  }) => void;
  onBack: () => void;
  onSkip: () => void;
}

const DEFAULT_SETTINGS: ArbitrageSettings = {
  checkCalendar: true,
  checkButterfly: true,
  checkVertical: true,
  toleranceCalendar: 0.001,
  toleranceButterfly: 0.002,
  toleranceVertical: 0.001,
};

export function Step3ArbitrageDetection({
  parsedQuotes,
  spotPrice,
  selectedStrikes,
  selectedMaturities,
  initialResults,
  initialSettings,
  onComplete,
  onBack,
  onSkip,
}: Step3ArbitrageDetectionProps) {
  const [settings, setSettings] = useState<ArbitrageSettings>(
    initialSettings || DEFAULT_SETTINGS
  );
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasRun, setHasRun] = useState(!!initialResults);
  const [results, setResults] = useState<ArbitrageOpportunity[]>(initialResults || []);

  // Filter data to selected strikes and maturities
  const filteredData = useMemo(() => {
    return parsedQuotes.filter(
      (q) => selectedStrikes.includes(q.strike) && selectedMaturities.includes(q.maturity)
    );
  }, [parsedQuotes, selectedStrikes, selectedMaturities]);

  const handleSettingChange = useCallback(
    <K extends keyof ArbitrageSettings>(key: K, value: ArbitrageSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      setHasRun(false); // Reset when settings change
    },
    []
  );

  const runDetection = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    toast.info('Running arbitrage detection...');

    // Simulate progressive detection
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 20;
      });
    }, 150);

    // Simulate API call - in production, call useArbitrageDetection hook
    await new Promise((resolve) => setTimeout(resolve, 1500));

    clearInterval(progressInterval);
    setProgress(100);

    // Generate mock results based on settings and data
    const mockResults = generateMockArbitrageResults(filteredData, spotPrice, settings);
    setResults(mockResults);
    setHasRun(true);
    setIsRunning(false);

    if (mockResults.length === 0) {
      toast.success('No arbitrage violations detected!');
    } else {
      toast.warning(`Found ${mockResults.length} arbitrage violations`);
    }
  }, [filteredData, spotPrice, settings]);

  const handleContinue = useCallback(() => {
    onComplete({
      arbitrageSettings: settings,
      arbitrageResults: results,
    });
  }, [onComplete, settings, results]);

  // Group results by type for summary
  const resultsSummary = useMemo(() => {
    const calendar = results.filter((r) => r.type === 'calendar').length;
    const butterfly = results.filter((r) => r.type === 'butterfly').length;
    const vertical = results.filter((r) => r.type === 'vertical').length;
    return { calendar, butterfly, vertical, total: results.length };
  }, [results]);

  const anyChecksEnabled = settings.checkCalendar || settings.checkButterfly || settings.checkVertical;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-surface-100">Step 3: Arbitrage Detection</h2>
        <p className="text-surface-400 mt-1">
          Detect static arbitrage violations in the volatility surface.
        </p>
      </div>

      {/* Data info */}
      <Alert variant="info">
        <Info className="h-4 w-4" />
        <AlertDescription className="flex flex-wrap items-center gap-3">
          <span>Analyzing:</span>
          <Badge variant="secondary">{filteredData.length} data points</Badge>
          <Badge variant="secondary">{selectedStrikes.length} strikes</Badge>
          <Badge variant="secondary">{selectedMaturities.length} maturities</Badge>
          <Badge variant="outline">Spot: ${spotPrice.toFixed(2)}</Badge>
        </AlertDescription>
      </Alert>

      {/* Detection Settings */}
      <Card className="bg-surface-800/50 border-surface-700/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-primary-400" />
            Detection Settings
          </CardTitle>
          <CardDescription>
            Configure which arbitrage conditions to check and their tolerances.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calendar Spread */}
          <div className="space-y-3 p-4 rounded-lg bg-surface-900/30 border border-surface-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Calendar className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <Label htmlFor="calendar" className="text-surface-200 font-medium">
                    Calendar Spread Arbitrage
                  </Label>
                  <p className="text-sm text-surface-500">
                    Total variance must increase with maturity
                  </p>
                </div>
              </div>
              <Switch
                id="calendar"
                checked={settings.checkCalendar}
                onCheckedChange={(checked) => handleSettingChange('checkCalendar', checked)}
              />
            </div>
            {settings.checkCalendar && (
              <div className="pl-12 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-surface-400">
                    Tolerance: {(settings.toleranceCalendar * 100).toFixed(2)}%
                  </Label>
                </div>
                <Slider
                  value={[settings.toleranceCalendar * 1000]}
                  onValueChange={([v]) => handleSettingChange('toleranceCalendar', v / 1000)}
                  min={0}
                  max={10}
                  step={0.5}
                  className="max-w-xs"
                />
              </div>
            )}
          </div>

          {/* Butterfly Spread */}
          <div className="space-y-3 p-4 rounded-lg bg-surface-900/30 border border-surface-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <GitBranch className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <Label htmlFor="butterfly" className="text-surface-200 font-medium">
                    Butterfly Spread Arbitrage
                  </Label>
                  <p className="text-sm text-surface-500">
                    Smile convexity must be non-negative
                  </p>
                </div>
              </div>
              <Switch
                id="butterfly"
                checked={settings.checkButterfly}
                onCheckedChange={(checked) => handleSettingChange('checkButterfly', checked)}
              />
            </div>
            {settings.checkButterfly && (
              <div className="pl-12 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-surface-400">
                    Tolerance: {(settings.toleranceButterfly * 100).toFixed(2)}%
                  </Label>
                </div>
                <Slider
                  value={[settings.toleranceButterfly * 1000]}
                  onValueChange={([v]) => handleSettingChange('toleranceButterfly', v / 1000)}
                  min={0}
                  max={20}
                  step={0.5}
                  className="max-w-xs"
                />
              </div>
            )}
          </div>

          {/* Vertical Spread */}
          <div className="space-y-3 p-4 rounded-lg bg-surface-900/30 border border-surface-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <Label htmlFor="vertical" className="text-surface-200 font-medium">
                    Vertical Spread Arbitrage
                  </Label>
                  <p className="text-sm text-surface-500">
                    Call prices must decrease with strike
                  </p>
                </div>
              </div>
              <Switch
                id="vertical"
                checked={settings.checkVertical}
                onCheckedChange={(checked) => handleSettingChange('checkVertical', checked)}
              />
            </div>
            {settings.checkVertical && (
              <div className="pl-12 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-surface-400">
                    Tolerance: {(settings.toleranceVertical * 100).toFixed(2)}%
                  </Label>
                </div>
                <Slider
                  value={[settings.toleranceVertical * 1000]}
                  onValueChange={([v]) => handleSettingChange('toleranceVertical', v / 1000)}
                  min={0}
                  max={10}
                  step={0.5}
                  className="max-w-xs"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Run Detection Button */}
      <div className="flex flex-col items-center gap-4">
        {isRunning && (
          <div className="w-full max-w-md space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-surface-400">
              Scanning for violations... {Math.round(progress)}%
            </p>
          </div>
        )}
        {!isRunning && (
          <Button 
            onClick={runDetection} 
            disabled={!anyChecksEnabled} 
            size="lg" 
            className="px-8"
          >
            <Play className="mr-2 h-5 w-5" />
            {hasRun ? 'Re-run Detection' : 'Run Arbitrage Detection'}
          </Button>
        )}
        {!anyChecksEnabled && (
          <p className="text-sm text-error-400">
            Enable at least one arbitrage check to run detection
          </p>
        )}
      </div>

      {/* Results */}
      {hasRun && (
        <>
          {results.length === 0 ? (
            <Alert variant="success">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>No Violations Found</AlertTitle>
              <AlertDescription>
                The volatility surface is free of static arbitrage within the specified tolerances.
                You can proceed directly to results or skip the correction step.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{results.length} Violations Detected</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-2 mt-2">
                  {resultsSummary.calendar > 0 && (
                    <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                      {resultsSummary.calendar} Calendar
                    </Badge>
                  )}
                  {resultsSummary.butterfly > 0 && (
                    <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                      {resultsSummary.butterfly} Butterfly
                    </Badge>
                  )}
                  {resultsSummary.vertical > 0 && (
                    <Badge variant="outline" className="border-green-500/50 text-green-400">
                      {resultsSummary.vertical} Vertical
                    </Badge>
                  )}
                  <span className="text-surface-400 ml-2">
                    Consider applying QP correction in the next step.
                  </span>
                </AlertDescription>
              </Alert>

              <Card className="bg-surface-800/50 border-surface-700/50">
                <CardHeader>
                  <CardTitle className="text-base">Detected Violations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ArbitrageTable opportunities={results} />
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Navigation */}
      <WizardNavigation
        onBack={onBack}
        onNext={handleContinue}
        onSkip={onSkip}
        showSkip={!hasRun}
        skipLabel="Skip Detection"
        nextDisabled={!hasRun}
        nextLabel={results.length > 0 ? 'Continue to Correction' : 'Continue to Results'}
      />
    </div>
  );
}

// Mock arbitrage result generator
function generateMockArbitrageResults(
  data: QuoteInput[],
  spotPrice: number,
  settings: ArbitrageSettings
): ArbitrageOpportunity[] {
  const results: ArbitrageOpportunity[] = [];
  let id = 1;

  if (!data || data.length === 0) return results;

  const strikes = [...new Set(data.map((d) => d.strike))].sort((a, b) => a - b);
  const maturities = [...new Set(data.map((d) => d.maturity))].sort((a, b) => a - b);

  // Generate calendar violations (variance should increase with maturity)
  if (settings.checkCalendar && maturities.length >= 2) {
    // Pick an ATM strike for calendar check
    const atmStrike = strikes.reduce((prev, curr) =>
      Math.abs(curr - spotPrice) < Math.abs(prev - spotPrice) ? curr : prev
    );
    
    // Simulate a calendar violation
    if (Math.random() > 0.3) {
      results.push({
        id: String(id++),
        type: 'calendar',
        strike1: atmStrike,
        maturity1: maturities[0],
        maturity2: maturities[1],
        severity: 0.65 + Math.random() * 0.25,
        expectedProfit: 10 + Math.random() * 15,
        description: 'Near-term variance exceeds far-term variance',
      });
    }
  }

  // Generate butterfly violations (convexity must be non-negative)
  if (settings.checkButterfly && strikes.length >= 3) {
    const midIdx = Math.floor(strikes.length / 2);
    
    if (Math.random() > 0.4) {
      results.push({
        id: String(id++),
        type: 'butterfly',
        strike1: strikes[midIdx - 1],
        strike2: strikes[midIdx],
        strike3: strikes[midIdx + 1],
        maturity1: maturities[Math.floor(maturities.length / 2)],
        severity: 0.35 + Math.random() * 0.35,
        expectedProfit: 5 + Math.random() * 10,
        description: 'Negative convexity in volatility smile',
      });
    }
  }

  // Generate vertical violations (call prices must decrease with strike)
  if (settings.checkVertical && strikes.length >= 2) {
    const upperStrikes = strikes.filter((s) => s > spotPrice);
    
    if (upperStrikes.length >= 2 && Math.random() > 0.5) {
      results.push({
        id: String(id++),
        type: 'vertical',
        strike1: upperStrikes[0],
        strike2: upperStrikes[1],
        maturity1: maturities[0],
        severity: 0.25 + Math.random() * 0.25,
        expectedProfit: 2 + Math.random() * 6,
        description: 'Call price increases with strike',
      });
    }
  }

  return results;
}
