import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  nextStep,
  prevStep,
  goToStep,
  resetWizard,
  setInputMethod,
  setRawData,
  setParsedQuotes,
  setMarketData,
  setSurface,
  setDetectionResult,
  setCorrectionResponse,
  setProcessing,
  setError,
  clearError,
} from '@/store/slices/wizardSlice';
import type { 
  WizardStep, 
  DataInputMethod,
  DataInputState,
  WizardState as _WizardState,
} from '@/types';
import type { QuoteInput, SurfaceData, ArbitrageDetectionResult, CorrectionResponse } from '@/types';
import { WIZARD_STEPS } from '@/types';

const STORAGE_KEY = 'vol-arb-wizard-state';

export function useWizardState() {
  const dispatch = useAppDispatch();
  const wizard = useAppSelector((state) => state.wizard);

  // Get current step index
  const currentStepIndex = useMemo(() => {
    return WIZARD_STEPS.findIndex((s) => s.id === wizard.currentStep);
  }, [wizard.currentStep]);

  // Persist to localStorage on changes (excluding non-serializable data)
  useEffect(() => {
    try {
      const persistableData = {
        currentStep: wizard.currentStep,
        completedSteps: wizard.completedSteps,
        dataInput: {
          ...wizard.dataInput,
          // Don't persist raw data if it's too large
          rawData: wizard.dataInput.rawData.length > 10000 ? '' : wizard.dataInput.rawData,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistableData));
    } catch (e) {
      console.error('Failed to persist wizard state:', e);
    }
  }, [wizard]);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore basic state, not computed results
        if (parsed.dataInput?.marketData) {
          dispatch(setMarketData(parsed.dataInput.marketData));
        }
        if (parsed.dataInput?.method) {
          dispatch(setInputMethod(parsed.dataInput.method));
        }
      }
    } catch (e) {
      console.error('Failed to restore wizard state:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation actions
  const goToNextStep = useCallback(() => {
    dispatch(nextStep());
  }, [dispatch]);

  const goToPrevStep = useCallback(() => {
    dispatch(prevStep());
  }, [dispatch]);

  const goToSpecificStep = useCallback(
    (step: WizardStep) => {
      dispatch(goToStep(step));
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetWizard());
    localStorage.removeItem(STORAGE_KEY);
  }, [dispatch]);

  // Data actions
  const updateInputMethod = useCallback(
    (method: DataInputMethod) => {
      dispatch(setInputMethod(method));
    },
    [dispatch]
  );

  const updateRawData = useCallback(
    (data: string) => {
      dispatch(setRawData(data));
    },
    [dispatch]
  );

  const updateParsedQuotes = useCallback(
    (quotes: QuoteInput[]) => {
      dispatch(setParsedQuotes(quotes));
    },
    [dispatch]
  );

  const updateMarketData = useCallback(
    (data: Partial<DataInputState['marketData']>) => {
      dispatch(setMarketData(data));
    },
    [dispatch]
  );

  const updateSurface = useCallback(
    (surface: SurfaceData | null) => {
      dispatch(setSurface(surface));
    },
    [dispatch]
  );

  const updateDetectionResult = useCallback(
    (result: ArbitrageDetectionResult | null) => {
      dispatch(setDetectionResult(result));
    },
    [dispatch]
  );

  const updateCorrectionResponse = useCallback(
    (response: CorrectionResponse | null) => {
      dispatch(setCorrectionResponse(response));
    },
    [dispatch]
  );

  // Status actions
  const startProcessing = useCallback(
    (step?: WizardStep) => {
      dispatch(setProcessing({ isProcessing: true, step }));
    },
    [dispatch]
  );

  const stopProcessing = useCallback(() => {
    dispatch(setProcessing({ isProcessing: false }));
  }, [dispatch]);

  const setErrorMessage = useCallback(
    (error: string | null) => {
      if (error) {
        dispatch(setError(error));
      } else {
        dispatch(clearError());
      }
    },
    [dispatch]
  );

  // Step helpers
  const canNavigateToStep = useCallback(
    (step: WizardStep): boolean => {
      const targetIndex = WIZARD_STEPS.findIndex((s) => s.id === step);
      // Can always go back
      if (targetIndex < currentStepIndex) return true;
      // Can go to current step
      if (step === wizard.currentStep) return true;
      // Can go to completed steps
      if (wizard.completedSteps.includes(step)) return true;
      // Can only go to next step if validation passes
      if (targetIndex === currentStepIndex + 1) {
        const validation = wizard.stepValidation[wizard.currentStep];
        return validation?.isValid ?? false;
      }
      return false;
    },
    [wizard.currentStep, wizard.completedSteps, wizard.stepValidation, currentStepIndex]
  );

  const isStepComplete = useCallback(
    (step: WizardStep): boolean => {
      return wizard.completedSteps.includes(step);
    },
    [wizard.completedSteps]
  );

  const isStepValid = useCallback(
    (step: WizardStep): boolean => {
      return wizard.stepValidation[step]?.isValid ?? false;
    },
    [wizard.stepValidation]
  );

  return {
    // State
    currentStep: wizard.currentStep,
    currentStepIndex,
    completedSteps: wizard.completedSteps,
    dataInput: wizard.dataInput,
    surface: wizard.surface,
    detectionResult: wizard.detectionResult,
    correctionResponse: wizard.correctionResponse,
    isProcessing: wizard.isProcessing,
    processingStep: wizard.processingStep,
    error: wizard.error,
    stepValidation: wizard.stepValidation,

    // Navigation
    goToNextStep,
    goToPrevStep,
    goToStep: goToSpecificStep,
    reset,

    // Data updates
    updateInputMethod,
    updateRawData,
    updateParsedQuotes,
    updateMarketData,
    updateSurface,
    updateDetectionResult,
    updateCorrectionResponse,

    // Status
    startProcessing,
    stopProcessing,
    setError: setErrorMessage,

    // Helpers
    canNavigateToStep,
    isStepComplete,
    isStepValid,
    steps: WIZARD_STEPS,
  };
}
