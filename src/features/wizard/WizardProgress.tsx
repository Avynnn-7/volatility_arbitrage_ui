import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Flexible step interface that works with both numeric and string IDs
interface WizardStep {
  id: number | string;
  title: string;
  description: string;
  isOptional?: boolean;
}

interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number | string;
  completedSteps: (number | string)[];
  onStepClick: (stepId: number | string) => void;
}

export function WizardProgress({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: WizardProgressProps) {
  return (
    <nav aria-label="Progress" className="px-4 py-2">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = typeof step.id === 'number' && typeof currentStep === 'number' 
            ? step.id < currentStep 
            : index < steps.findIndex((s) => s.id === currentStep);
          const isClickable = isCompleted || isCurrent || isPast;

          return (
            <li key={String(step.id)} className="relative flex-1">
              {/* Connector line */}
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    'absolute left-[calc(50%+24px)] right-[calc(-50%+24px)] top-5 h-0.5',
                    isCompleted || isPast ? 'bg-primary-500' : 'bg-surface-700'
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step indicator */}
              <div className="relative flex flex-col items-center group">
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200',
                    isCompleted && 'border-primary-500 bg-primary-500 text-white',
                    isCurrent && !isCompleted && 'border-primary-500 bg-surface-800 text-primary-400 ring-4 ring-primary-500/20',
                    isPast && !isCompleted && 'border-primary-400 bg-surface-800 text-primary-400',
                    !isCompleted && !isCurrent && !isPast && 'border-surface-600 bg-surface-800 text-surface-500',
                    isClickable && 'cursor-pointer hover:scale-105',
                    !isClickable && 'cursor-not-allowed opacity-60'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </button>

                {/* Step label */}
                <div className="mt-3 text-center min-w-[80px]">
                  <p
                    className={cn(
                      'text-sm font-medium transition-colors',
                      isCurrent && 'text-primary-400',
                      (isPast || isCompleted) && !isCurrent && 'text-surface-200',
                      !isCurrent && !isPast && !isCompleted && 'text-surface-500'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-surface-500 hidden sm:block mt-0.5 max-w-[120px]">
                    {step.description}
                  </p>
                  {step.isOptional && (
                    <span className="text-xs text-surface-600 hidden sm:block">
                      (Optional)
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
