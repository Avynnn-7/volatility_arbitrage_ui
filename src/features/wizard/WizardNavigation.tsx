import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

interface WizardNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  backLabel?: string;
  nextLabel?: string;
  skipLabel?: string;
  showBack?: boolean;
  showNext?: boolean;
  showSkip?: boolean;
  nextDisabled?: boolean;
  nextLoading?: boolean;
}

export function WizardNavigation({
  onBack,
  onNext,
  onSkip,
  backLabel = 'Back',
  nextLabel = 'Continue',
  skipLabel = 'Skip',
  showBack = true,
  showNext = true,
  showSkip = false,
  nextDisabled = false,
  nextLoading = false,
}: WizardNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-surface-700 mt-6">
      <div>
        {showBack && onBack && (
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showSkip && onSkip && (
          <Button variant="ghost" onClick={onSkip}>
            {skipLabel}
            <SkipForward className="ml-2 h-4 w-4" />
          </Button>
        )}
        {showNext && onNext && (
          <Button 
            onClick={onNext} 
            disabled={nextDisabled} 
            loading={nextLoading}
          >
            {nextLabel}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
