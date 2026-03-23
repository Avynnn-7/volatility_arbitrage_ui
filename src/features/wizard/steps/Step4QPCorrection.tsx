import { useState, useCallback, useMemo } from 'react';
import { WizardNavigation } from '../WizardNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  CheckCircle, 
  Info, 
  Settings2, 
  Zap,
  RotateCcw,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatVolatility } from '@/lib/utils';
import type { QuoteInput, ArbitrageOpportunity } from '@/types';

interface QPSettings {
  regularizationStrength: number;
  preserveAtm: boolean;
  maxIterations: number;
  tolerance: number;
  smoothnessWeight: number;
  penaltyMethod: 'quadratic' | 'linear' | 'huber';
}

interface CorrectionResult {
  success: boolean;
  iterations: number;
  residual: number;
  violationsRemoved: number;
  totalViolations: number;
  maxAdjustment: number;
  avgAdjustment: number;
  correctedSurface: QuoteInput[];
  adjustments: SurfaceAdjustment[];
  convergenceHistory: number[];
}

interface SurfaceAdjustment {
  strike: number;
  maturity: number;
  originalVol: number;
  correctedVol: number;
  adjustment: number;
}

interface Step4QPCorrectionProps {
  parsedQuotes: QuoteInput[];
  spotPrice: number;
  selectedStrikes: number[];
  selectedMaturities: number[];
  arbitrageResults: ArbitrageOpportunity[];
  initialSettings?: QPSettings;
  initialResult?: CorrectionResult;
  onComplete: (data: {
    qpSettings: QPSettings;
    qpResult: CorrectionResult;
    correctedSurface: QuoteInput[];
  }) => void;
  onBack: () => void;
  onSkip: () => void;
}

const DEFAULT_SETTINGS: QPSettings = {
  regularizationStrength: 0.01,
  preserveAtm: true,
  maxIterations: 1000,
  tolerance: 1e-6,
  smoothnessWeight: 0.1,
  penaltyMethod: 'quadratic',
};

export function Step4QPCorrection({
  parsedQuotes,
  spotPrice,
  selectedStrikes,
  selectedMaturities,
  arbitrageResults,
  initialSettings,
  initialResult,
  onComplete,
  onBack,
  onSkip,
}: Step4QPCorrectionProps) {
  const [settings, setSettings] = useState<QPSettings>(initialSettings || DEFAULT_SETTINGS);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState<string>('');
  const [result, setResult] = useState<CorrectionResult | null>(initialResult || null);

  // Filter data to selected strikes and maturities
  const filteredData = useMemo(() => {
    return parsedQuotes.filter(
      (q) => selectedStrikes.includes(q.strike) && selectedMaturities.includes(q.maturity)
    );
  }, [parsedQuotes, selectedStrikes, selectedMaturities]);

  const violationCount = arbitrageResults?.length || 0;

  const handleSettingChange = useCallback(<K extends keyof QPSettings>(key: K, value: QPSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setResult(null); // Reset when settings change
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setResult(null);
  }, []);

  const runCorrection = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setProgressStage('Initializing QP solver...');
    toast.info('Starting QP optimization...');

    const stages = [
      { progress: 15, stage: 'Building constraint matrix...' },
      { progress: 30, stage: 'Setting up objective function...' },
      { progress: 50, stage: 'Running optimization iterations...' },
      { progress: 70, stage: 'Checking convergence...' },
      { progress: 85, stage: 'Validating corrections...' },
      { progress: 95, stage: 'Finalizing results...' },
    ];

    // Simulate progressive stages
    for (const { progress: targetProgress, stage } of stages) {
      await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));
      setProgress(targetProgress);
      setProgressStage(stage);
    }

    // Generate mock correction result
    const mockResult = generateCorrectionResult(filteredData, spotPrice, settings, arbitrageResults);
    
    setProgress(100);
    setProgressStage('Complete!');
    setResult(mockResult);
    setIsRunning(false);

    if (mockResult.success) {
      toast.success(`QP correction completed! Removed ${mockResult.violationsRemoved} violations.`);
    } else {
      toast.error('QP correction did not fully converge. Results may be suboptimal.');
    }
  }, [filteredData, spotPrice, settings, arbitrageResults]);

  const handleContinue = useCallback(() => {
    if (!result) return;
    onComplete({
      qpSettings: settings,
      qpResult: result,
      correctedSurface: result.correctedSurface,
    });
  }, [onComplete, settings, result]);

  // Calculate summary statistics for comparison
  const comparisonStats = useMemo(() => {
    if (!result) return null;
    
    const largeAdjustments = result.adjustments.filter(
      (a) => Math.abs(a.adjustment) > 0.005
    );
    const smallAdjustments = result.adjustments.filter(
      (a) => Math.abs(a.adjustment) <= 0.001
    );
    
    return {
      totalPoints: result.adjustments.length,
      largeAdjustments: largeAdjustments.length,
      smallAdjustments: smallAdjustments.length,
      mediumAdjustments: result.adjustments.length - largeAdjustments.length - smallAdjustments.length,
    };
  }, [result]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-surface-100">Step 4: QP Correction</h2>
        <p className="text-surface-400 mt-1">
          Apply quadratic programming to remove arbitrage violations while preserving surface shape.
        </p>
      </div>

      {/* No violations case */}
      {violationCount === 0 && (
        <Alert variant="info">
          <Info className="h-4 w-4" />
          <AlertTitle>No Corrections Needed</AlertTitle>
          <AlertDescription>
            No arbitrage violations were detected in the previous step. You can skip QP correction
            and proceed directly to results.
          </AlertDescription>
        </Alert>
      )}

      {/* Violations summary */}
      {violationCount > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{violationCount} Violations to Correct</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2 mt-1">
            <span>The QP optimizer will adjust implied volatilities to remove these violations</span>
            <span className="text-surface-400">while minimizing changes to the original surface.</span>
          </AlertDescription>
        </Alert>
      )}

      {/* QP Settings */}
      <Card className="bg-surface-800/50 border-surface-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary-400" />
                Optimization Settings
              </CardTitle>
              <CardDescription>
                Configure the quadratic programming solver parameters.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={resetSettings}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Regularization Strength */}
          <div className="space-y-3 p-4 rounded-lg bg-surface-900/30 border border-surface-700/50">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-surface-200 font-medium">Regularization Strength</Label>
                <p className="text-sm text-surface-500">
                  Balance between removing violations and preserving original shape
                </p>
              </div>
              <Badge variant="outline" className="font-mono">
                {settings.regularizationStrength.toExponential(2)}
              </Badge>
            </div>
            <Slider
              value={[Math.log10(settings.regularizationStrength) + 4]}
              onValueChange={([v]) => handleSettingChange('regularizationStrength', Math.pow(10, v - 4))}
              min={0}
              max={4}
              step={0.1}
              className="max-w-md"
            />
            <div className="flex justify-between text-xs text-surface-500 max-w-md">
              <span>Strong Correction</span>
              <span>Preserve Shape</span>
            </div>
          </div>

          {/* Smoothness Weight */}
          <div className="space-y-3 p-4 rounded-lg bg-surface-900/30 border border-surface-700/50">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-surface-200 font-medium">Smoothness Weight</Label>
                <p className="text-sm text-surface-500">
                  Penalize large second derivatives in the corrected surface
                </p>
              </div>
              <Badge variant="outline" className="font-mono">
                {settings.smoothnessWeight.toFixed(2)}
              </Badge>
            </div>
            <Slider
              value={[settings.smoothnessWeight * 100]}
              onValueChange={([v]) => handleSettingChange('smoothnessWeight', v / 100)}
              min={0}
              max={100}
              step={5}
              className="max-w-md"
            />
            <div className="flex justify-between text-xs text-surface-500 max-w-md">
              <span>Allow Kinks</span>
              <span>Enforce Smooth</span>
            </div>
          </div>

          {/* Preserve ATM */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-surface-900/30 border border-surface-700/50">
            <div>
              <Label htmlFor="preserveAtm" className="text-surface-200 font-medium">
                Preserve ATM Volatility
              </Label>
              <p className="text-sm text-surface-500">
                Minimize changes to at-the-money options (typically most liquid)
              </p>
            </div>
            <Switch
              id="preserveAtm"
              checked={settings.preserveAtm}
              onCheckedChange={(checked) => handleSettingChange('preserveAtm', checked)}
            />
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4 pt-4 border-t border-surface-700">
            <h4 className="text-sm font-medium text-surface-300 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Advanced Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxIter" className="text-sm text-surface-400">
                  Max Iterations
                </Label>
                <Input
                  id="maxIter"
                  type="number"
                  value={settings.maxIterations}
                  onChange={(e) => handleSettingChange('maxIterations', parseInt(e.target.value) || 1000)}
                  min={100}
                  max={10000}
                  className="bg-surface-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tolerance" className="text-sm text-surface-400">
                  Convergence Tolerance
                </Label>
                <Input
                  id="tolerance"
                  type="text"
                  value={settings.tolerance.toExponential(0)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      handleSettingChange('tolerance', val);
                    }
                  }}
                  className="bg-surface-900 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="penaltyMethod" className="text-sm text-surface-400">
                  Penalty Method
                </Label>
                <select
                  id="penaltyMethod"
                  value={settings.penaltyMethod}
                  onChange={(e) => handleSettingChange('penaltyMethod', e.target.value as QPSettings['penaltyMethod'])}
                  className="w-full h-10 rounded-md border border-surface-700 bg-surface-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="quadratic">Quadratic (L2)</option>
                  <option value="linear">Linear (L1)</option>
                  <option value="huber">Huber</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Run Correction Button */}
      <div className="flex flex-col items-center gap-4">
        {isRunning && (
          <div className="w-full max-w-md space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-surface-400">
              {progressStage} {Math.round(progress)}%
            </p>
          </div>
        )}
        {!isRunning && !result && (
          <Button 
            onClick={runCorrection} 
            disabled={violationCount === 0} 
            size="lg" 
            className="px-8"
          >
            <Play className="mr-2 h-5 w-5" />
            Run QP Correction
          </Button>
        )}
        {!isRunning && result && (
          <Button 
            onClick={runCorrection} 
            variant="outline"
            size="sm"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Re-run with New Settings
          </Button>
        )}
      </div>

      {/* Results */}
      {result && (
        <Card className="bg-surface-800/50 border-surface-700/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-success-400" />
                  <span className="text-success-400">Correction Complete</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-warning-400" />
                  <span className="text-warning-400">Partial Convergence</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="bg-surface-900/50">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="details">Adjustments</TabsTrigger>
                <TabsTrigger value="comparison">Before/After</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-surface-900/50 border border-surface-700/50">
                    <p className="text-2xl font-bold text-success-400">{result.violationsRemoved}</p>
                    <p className="text-sm text-surface-500">Violations Removed</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-surface-900/50 border border-surface-700/50">
                    <p className="text-2xl font-bold text-surface-100">{result.iterations}</p>
                    <p className="text-sm text-surface-500">Iterations</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-surface-900/50 border border-surface-700/50">
                    <p className="text-2xl font-bold font-mono text-surface-100">
                      {result.residual.toExponential(1)}
                    </p>
                    <p className="text-sm text-surface-500">Final Residual</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-surface-900/50 border border-surface-700/50">
                    <p className="text-2xl font-bold text-surface-100">
                      {formatVolatility(result.maxAdjustment)}
                    </p>
                    <p className="text-sm text-surface-500">Max IV Change</p>
                  </div>
                </div>

                {/* Adjustment Distribution */}
                {comparisonStats && (
                  <div className="p-4 rounded-lg bg-surface-900/30 border border-surface-700/50">
                    <h4 className="text-sm font-medium text-surface-300 mb-3">Adjustment Distribution</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-surface-800 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-success-500" 
                          style={{ width: `${(comparisonStats.smallAdjustments / comparisonStats.totalPoints) * 100}%` }}
                          title={`${comparisonStats.smallAdjustments} small adjustments (<0.1%)`}
                        />
                        <div 
                          className="h-full bg-warning-500" 
                          style={{ width: `${(comparisonStats.mediumAdjustments / comparisonStats.totalPoints) * 100}%` }}
                          title={`${comparisonStats.mediumAdjustments} medium adjustments`}
                        />
                        <div 
                          className="h-full bg-error-500" 
                          style={{ width: `${(comparisonStats.largeAdjustments / comparisonStats.totalPoints) * 100}%` }}
                          title={`${comparisonStats.largeAdjustments} large adjustments (>0.5%)`}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-surface-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-success-500" />
                        Small ({comparisonStats.smallAdjustments})
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-warning-500" />
                        Medium ({comparisonStats.mediumAdjustments})
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-error-500" />
                        Large ({comparisonStats.largeAdjustments})
                      </span>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                <div className="max-h-64 overflow-auto rounded-lg border border-surface-700/50">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-900/50 sticky top-0">
                      <tr className="border-b border-surface-700">
                        <th className="text-left p-3 font-medium text-surface-400">Strike</th>
                        <th className="text-left p-3 font-medium text-surface-400">Maturity</th>
                        <th className="text-right p-3 font-medium text-surface-400">Original</th>
                        <th className="text-right p-3 font-medium text-surface-400">Corrected</th>
                        <th className="text-right p-3 font-medium text-surface-400">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.adjustments
                        .filter((a) => Math.abs(a.adjustment) > 0.0001)
                        .sort((a, b) => Math.abs(b.adjustment) - Math.abs(a.adjustment))
                        .slice(0, 20)
                        .map((adj, i) => (
                          <tr key={i} className="border-b border-surface-800 hover:bg-surface-800/30">
                            <td className="p-3 font-mono">${adj.strike.toFixed(0)}</td>
                            <td className="p-3 font-mono">{(adj.maturity * 12).toFixed(1)}M</td>
                            <td className="p-3 text-right font-mono">{formatVolatility(adj.originalVol)}</td>
                            <td className="p-3 text-right font-mono">{formatVolatility(adj.correctedVol)}</td>
                            <td className={`p-3 text-right font-mono ${
                              adj.adjustment > 0 ? 'text-success-400' : 'text-error-400'
                            }`}>
                              {adj.adjustment > 0 ? '+' : ''}{formatVolatility(adj.adjustment)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-surface-500 mt-2 text-center">
                  Showing top 20 adjustments by magnitude
                </p>
              </TabsContent>

              <TabsContent value="comparison" className="mt-4">
                <div className="h-64 flex items-center justify-center bg-surface-900/30 rounded-lg border border-surface-700/50">
                  <div className="text-center">
                    <TrendingDown className="h-12 w-12 mx-auto mb-3 text-surface-600" />
                    <p className="text-surface-400">3D Surface Comparison</p>
                    <p className="text-sm text-surface-500 mt-1">
                      Side-by-side visualization available in full Surface Viewer
                    </p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => {
                      toast.info('Opening 3D comparison viewer...');
                    }}>
                      Open 3D Viewer
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <WizardNavigation
        onBack={onBack}
        onNext={handleContinue}
        onSkip={onSkip}
        showSkip={!result}
        skipLabel="Skip Correction"
        nextDisabled={!result && violationCount > 0}
        nextLabel="Continue to Results"
      />
    </div>
  );
}

// Generate corrected surface (mock implementation)
function generateCorrectionResult(
  originalData: QuoteInput[],
  spotPrice: number,
  settings: QPSettings,
  violations: ArbitrageOpportunity[]
): CorrectionResult {
  if (!originalData || originalData.length === 0) {
    return {
      success: true,
      iterations: 0,
      residual: 0,
      violationsRemoved: 0,
      totalViolations: 0,
      maxAdjustment: 0,
      avgAdjustment: 0,
      correctedSurface: [],
      adjustments: [],
      convergenceHistory: [],
    };
  }

  const adjustments: SurfaceAdjustment[] = [];
  const correctedSurface: QuoteInput[] = [];
  
  // Simulate correction based on settings
  const adjustmentScale = 1 / (settings.regularizationStrength * 100 + 1);
  
  for (const point of originalData) {
    // Calculate distance from ATM
    const moneyness = Math.abs(Math.log(point.strike / spotPrice));
    
    // ATM preservation factor
    const atmFactor = settings.preserveAtm ? Math.min(1, moneyness * 3) : 1;
    
    // Random adjustment scaled by settings
    let adjustment = (Math.random() - 0.5) * 0.02 * adjustmentScale * atmFactor;
    
    // Make adjustments smaller for smoother surfaces
    adjustment *= (1 - settings.smoothnessWeight * 0.5);
    
    const correctedVol = Math.max(0.01, point.impliedVol + adjustment);
    
    adjustments.push({
      strike: point.strike,
      maturity: point.maturity,
      originalVol: point.impliedVol,
      correctedVol,
      adjustment: correctedVol - point.impliedVol,
    });
    
    correctedSurface.push({
      ...point,
      impliedVol: correctedVol,
    });
  }

  // Generate convergence history
  const iterations = Math.min(settings.maxIterations, 50 + Math.floor(Math.random() * 100));
  const convergenceHistory: number[] = [];
  let residual = violations.length * 0.1;
  
  for (let i = 0; i < 10; i++) {
    convergenceHistory.push(residual);
    residual *= 0.6 + Math.random() * 0.2;
  }

  const maxAdj = Math.max(...adjustments.map((a) => Math.abs(a.adjustment)));
  const avgAdj = adjustments.reduce((sum, a) => sum + Math.abs(a.adjustment), 0) / adjustments.length;

  return {
    success: true,
    iterations,
    residual: residual * settings.tolerance * 1e5,
    violationsRemoved: violations.length,
    totalViolations: violations.length,
    maxAdjustment: maxAdj,
    avgAdjustment: avgAdj,
    correctedSurface,
    adjustments,
    convergenceHistory,
  };
}
