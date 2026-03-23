import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StrikePickerProps {
  spotPrice: number;
  strikes: number[];
  selectedStrikes: number[];
  onStrikesChange: (strikes: number[]) => void;
  className?: string;
}

export function StrikePicker({
  spotPrice,
  strikes,
  selectedStrikes,
  onStrikesChange,
  className,
}: StrikePickerProps) {
  const [customStrike, setCustomStrike] = React.useState('');

  const toggleStrike = (strike: number) => {
    if (selectedStrikes.includes(strike)) {
      onStrikesChange(selectedStrikes.filter((s) => s !== strike));
    } else {
      onStrikesChange([...selectedStrikes, strike].sort((a, b) => a - b));
    }
  };

  const addCustomStrike = () => {
    const strike = parseFloat(customStrike);
    if (!isNaN(strike) && strike > 0 && !selectedStrikes.includes(strike)) {
      onStrikesChange([...selectedStrikes, strike].sort((a, b) => a - b));
      setCustomStrike('');
    }
  };

  const getMoneyness = (strike: number): 'itm' | 'atm' | 'otm' => {
    const ratio = strike / spotPrice;
    if (ratio < 0.98) return 'itm';
    if (ratio > 1.02) return 'otm';
    return 'atm';
  };

  const selectAll = () => onStrikesChange([...strikes]);
  const clearAll = () => onStrikesChange([]);
  const selectAtm = () => {
    const atmStrikes = strikes.filter((s) => getMoneyness(s) === 'atm');
    onStrikesChange(atmStrikes);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label>Select Strikes (Spot: ${spotPrice.toFixed(2)})</Label>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            All
          </Button>
          <Button variant="outline" size="sm" onClick={selectAtm}>
            ATM
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {strikes.map((strike) => {
          const moneyness = getMoneyness(strike);
          const isSelected = selectedStrikes.includes(strike);
          return (
            <Badge
              key={strike}
              variant={isSelected ? moneyness : 'outline'}
              className={cn(
                'cursor-pointer transition-all hover:scale-105',
                !isSelected && 'opacity-50'
              )}
              onClick={() => toggleStrike(strike)}
            >
              ${strike.toFixed(0)}
            </Badge>
          );
        })}
      </div>

      <div className="flex items-center space-x-2">
        <Input
          type="number"
          placeholder="Custom strike..."
          value={customStrike}
          onChange={(e) => setCustomStrike(e.target.value)}
          className="w-32"
        />
        <Button variant="secondary" size="sm" onClick={addCustomStrike}>
          Add
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {selectedStrikes.length} strikes selected
      </p>
    </div>
  );
}
