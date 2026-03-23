import { cn, formatMaturity } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface MaturitySelectorProps {
  maturities: number[]; // in years
  selectedMaturities: number[];
  onMaturitiesChange: (maturities: number[]) => void;
  className?: string;
}

export function MaturitySelector({
  maturities,
  selectedMaturities,
  onMaturitiesChange,
  className,
}: MaturitySelectorProps) {
  const toggleMaturity = (maturity: number) => {
    if (selectedMaturities.includes(maturity)) {
      onMaturitiesChange(selectedMaturities.filter((m) => m !== maturity));
    } else {
      onMaturitiesChange([...selectedMaturities, maturity].sort((a, b) => a - b));
    }
  };

  const selectAll = () => onMaturitiesChange([...maturities]);
  const clearAll = () => onMaturitiesChange([]);
  const selectShortTerm = () => {
    onMaturitiesChange(maturities.filter((m) => m <= 0.25));
  };
  const selectMediumTerm = () => {
    onMaturitiesChange(maturities.filter((m) => m > 0.25 && m <= 1));
  };
  const selectLongTerm = () => {
    onMaturitiesChange(maturities.filter((m) => m > 1));
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label>Select Maturities</Label>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            All
          </Button>
          <Button variant="outline" size="sm" onClick={selectShortTerm}>
            Short
          </Button>
          <Button variant="outline" size="sm" onClick={selectMediumTerm}>
            Medium
          </Button>
          <Button variant="outline" size="sm" onClick={selectLongTerm}>
            Long
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
        {maturities.map((maturity) => {
          const isSelected = selectedMaturities.includes(maturity);
          return (
            <div
              key={maturity}
              className={cn(
                'flex items-center space-x-2 rounded-md border p-2 cursor-pointer transition-colors',
                isSelected ? 'border-primary bg-primary/10' : 'border-input hover:bg-muted'
              )}
              onClick={() => toggleMaturity(maturity)}
            >
              <Checkbox checked={isSelected} />
              <span className="text-sm font-medium">{formatMaturity(maturity)}</span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {selectedMaturities.length} maturities selected
      </p>
    </div>
  );
}
