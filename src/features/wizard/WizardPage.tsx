import { useState, useCallback, useMemo, useEffect } from 'react';
import { PageLayout } from '@/components/layout';
import { WizardProgress } from './WizardProgress';
import { useWizardState } from '@/hooks/useWizardState';
import { Step1DataUpload } from './steps/Step1DataUpload';
import { Step2Configuration } from './steps/Step2Configuration';
import { Step3ArbitrageDetection } from './steps/Step3ArbitrageDetection';
import { Step4QPCorrection } from './steps/Step4QPCorrection';
import { Step5Results } from './steps/Step5Results';
import { Card, CardContent } from '@/components/ui/card';
import { WIZARD_STEPS, type WizardStep } from '@/types';
import type { QuoteInput, ArbitrageOpportunity } from '@/types';

// Local wizard state interface
interface LocalWizardData {
  // Step 1
  parsedQuotes: QuoteInput[];
  fileName?: string;
  
  // Step 2
  spotPrice: number;
  riskFreeRate: number;
  dividendYield: number;
  selectedStrikes: number[];
  selectedMaturities: number[];
  interpolationMethod: 'linear' | 'cubic' | 'spline';
  
  // Step 3
  arbitrageSettings?: {
    checkCalendar: boolean;
    checkButterfly: boolean;
    checkVertical: boolean;
    toleranceCalendar: number;
    toleranceButterfly: number;
    toleranceVertical: number;
  };
  arbitrageResults: ArbitrageOpportunity[];
  
  // Step 4
  qpSettings?: {
    regularizationStrength: number;
    preserveAtm: boolean;
    maxIterations: number;
    tolerance: number;
    smoothnessWeight: number;
    penaltyMethod: 'quadratic' | 'linear' | 'huber';
  };
  qpResult?: {
    success: boolean;
    iterations: number;
    residual: number;
    violationsRemoved: number;
    maxAdjustment: number;
    avgAdjustment: number;
  };
  correctedSurface?: QuoteInput[];
}

// Step number to step ID mapping
const STEP_ORDER: WizardStep[] = [
  'data-input',
  'surface-preview',
  'arbitrage-detection',
  'correction',
  'export',
];

const getStepNumber = (stepId: WizardStep): number => {
  return STEP_ORDER.indexOf(stepId) + 1;
};

const getStepId = (stepNumber: number): WizardStep => {
  return STEP_ORDER[stepNumber - 1] || 'data-input';
};

// Default wizard data
const getInitialData = (): LocalWizardData => ({
  parsedQuotes: [],
  spotPrice: 100,
  riskFreeRate: 0.05,
  dividendYield: 0.02,
  selectedStrikes: [],
  selectedMaturities: [],
  interpolationMethod: 'cubic',
  arbitrageResults: [],
});

export function WizardPage() {
  const wizardState = useWizardState();
  const [localData, setLocalData] = useState<LocalWizardData>(getInitialData);

  // Get current step number
  const currentStepNumber = useMemo(() => {
    return getStepNumber(wizardState.currentStep);
  }, [wizardState.currentStep]);

  // Compute completed step numbers
  const completedStepNumbers = useMemo(() => {
    return wizardState.completedSteps.map((step) => getStepNumber(step));
  }, [wizardState.completedSteps]);

  // Extract unique strikes and maturities from parsed data
  useEffect(() => {
    if (localData.parsedQuotes.length > 0 && localData.selectedStrikes.length === 0) {
      const strikes = [...new Set(localData.parsedQuotes.map((q) => q.strike))].sort((a, b) => a - b);
      const maturities = [...new Set(localData.parsedQuotes.map((q) => q.maturity))].sort((a, b) => a - b);
      
      setTimeout(() => {
        setLocalData((prev) => ({
          ...prev,
          selectedStrikes: strikes,
          selectedMaturities: maturities,
        }));
      }, 0);
    }
  }, [localData.parsedQuotes, localData.selectedStrikes.length]);

  // Navigation helpers
  const goToStep = useCallback((stepNumber: number) => {
    const stepId = getStepId(stepNumber);
    wizardState.goToStep(stepId);
  }, [wizardState]);

  const handleReset = useCallback(() => {
    wizardState.reset();
    setLocalData(getInitialData());
  }, [wizardState]);

  // Render the current step
  const renderStep = () => {
    switch (currentStepNumber) {
      case 1:
        return (
          <Step1DataUpload
            initialData={localData.parsedQuotes.length > 0 ? localData.parsedQuotes : undefined}
            onComplete={(data) => {
              const strikes = [...new Set(data.parsedQuotes.map((q) => q.strike))].sort((a, b) => a - b);
              const maturities = [...new Set(data.parsedQuotes.map((q) => q.maturity))].sort((a, b) => a - b);
              
              setLocalData((prev) => ({
                ...prev,
                parsedQuotes: data.parsedQuotes,
                fileName: data.fileName,
                selectedStrikes: strikes,
                selectedMaturities: maturities,
              }));
              wizardState.updateParsedQuotes(data.parsedQuotes);
              wizardState.goToNextStep();
            }}
          />
        );

      case 2:
        return (
          <Step2Configuration
            parsedQuotes={localData.parsedQuotes}
            initialConfig={{
              spotPrice: localData.spotPrice,
              riskFreeRate: localData.riskFreeRate,
              dividendYield: localData.dividendYield,
              selectedStrikes: localData.selectedStrikes,
              selectedMaturities: localData.selectedMaturities,
              interpolationMethod: localData.interpolationMethod,
            }}
            onComplete={(data) => {
              setLocalData((prev) => ({
                ...prev,
                spotPrice: data.spotPrice,
                riskFreeRate: data.riskFreeRate,
                dividendYield: data.dividendYield,
                selectedStrikes: data.selectedStrikes,
                selectedMaturities: data.selectedMaturities,
                interpolationMethod: data.interpolationMethod,
              }));
              wizardState.updateMarketData({
                spot: data.spotPrice,
                riskFreeRate: data.riskFreeRate,
                dividendYield: data.dividendYield,
              });
              wizardState.goToNextStep();
            }}
            onBack={() => wizardState.goToPrevStep()}
          />
        );

      case 3:
        return (
          <Step3ArbitrageDetection
            parsedQuotes={localData.parsedQuotes}
            spotPrice={localData.spotPrice}
            selectedStrikes={localData.selectedStrikes}
            selectedMaturities={localData.selectedMaturities}
            initialResults={localData.arbitrageResults.length > 0 ? localData.arbitrageResults : undefined}
            initialSettings={localData.arbitrageSettings}
            onComplete={(data) => {
              setLocalData((prev) => ({
                ...prev,
                arbitrageSettings: data.arbitrageSettings,
                arbitrageResults: data.arbitrageResults,
              }));
              wizardState.goToNextStep();
            }}
            onBack={() => wizardState.goToPrevStep()}
            onSkip={() => {
              setLocalData((prev) => ({
                ...prev,
                arbitrageResults: [],
              }));
              wizardState.goToNextStep();
            }}
          />
        );

      case 4:
        return (
          <Step4QPCorrection
            parsedQuotes={localData.parsedQuotes}
            spotPrice={localData.spotPrice}
            selectedStrikes={localData.selectedStrikes}
            selectedMaturities={localData.selectedMaturities}
            arbitrageResults={localData.arbitrageResults}
            initialSettings={localData.qpSettings}
            initialResult={localData.qpResult ? {
              ...localData.qpResult,
              totalViolations: localData.arbitrageResults.length,
              correctedSurface: localData.correctedSurface || [],
              adjustments: [],
              convergenceHistory: [],
            } : undefined}
            onComplete={(data) => {
              setLocalData((prev) => ({
                ...prev,
                qpSettings: data.qpSettings,
                qpResult: {
                  success: data.qpResult.success,
                  iterations: data.qpResult.iterations,
                  residual: data.qpResult.residual,
                  violationsRemoved: data.qpResult.violationsRemoved,
                  maxAdjustment: data.qpResult.maxAdjustment,
                  avgAdjustment: data.qpResult.avgAdjustment,
                },
                correctedSurface: data.correctedSurface,
              }));
              wizardState.goToNextStep();
            }}
            onBack={() => wizardState.goToPrevStep()}
            onSkip={() => {
              wizardState.goToNextStep();
            }}
          />
        );

      case 5:
        return (
          <Step5Results
            parsedQuotes={localData.parsedQuotes}
            spotPrice={localData.spotPrice}
            riskFreeRate={localData.riskFreeRate}
            dividendYield={localData.dividendYield}
            selectedStrikes={localData.selectedStrikes}
            selectedMaturities={localData.selectedMaturities}
            arbitrageResults={localData.arbitrageResults}
            correctedSurface={localData.correctedSurface}
            qpResult={localData.qpResult}
            onRestart={handleReset}
            onBack={() => wizardState.goToPrevStep()}
          />
        );

      default:
        return null;
    }
  };

  // Build steps config for WizardProgress
  const stepsConfig = useMemo(() => {
    return WIZARD_STEPS.map((step, index) => ({
      id: index + 1,
      title: step.title,
      description: step.description,
      isOptional: step.isOptional,
    }));
  }, []);

  return (
    <PageLayout
      title="Analysis Wizard"
      description="Step-by-step volatility surface analysis and arbitrage correction"
    >
      <div className="space-y-6">
        {/* Progress indicator */}
        <WizardProgress
          steps={stepsConfig}
          currentStep={currentStepNumber}
          completedSteps={completedStepNumbers}
          onStepClick={(stepNum) => {
            const stepNumValue = typeof stepNum === 'number' ? stepNum : parseInt(String(stepNum), 10);
            // Only allow clicking completed steps or current step or past steps
            if (completedStepNumbers.includes(stepNumValue) || stepNumValue === currentStepNumber || stepNumValue < currentStepNumber) {
              goToStep(stepNumValue);
            }
          }}
        />

        {/* Step content */}
        <Card className="bg-surface-800/50 border-surface-700/50">
          <CardContent className="p-6">
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
