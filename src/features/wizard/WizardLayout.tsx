import { Card, CardContent } from '@/components/ui/card';
import { WizardProgress } from './WizardProgress';
import { cn } from '@/lib/utils';
import type { WizardStepConfig } from '@/types';

interface WizardLayoutProps {
  steps: WizardStepConfig[];
  currentStep: string;
  completedSteps: string[];
  onStepClick: (stepId: string | number) => void;
  children: React.ReactNode;
  className?: string;
}

export function WizardLayout({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  children,
  className,
}: WizardLayoutProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress indicator */}
      <WizardProgress
        steps={steps}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={onStepClick}
      />

      {/* Step content */}
      <Card className="bg-surface-800/50 border-surface-700/50">
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
