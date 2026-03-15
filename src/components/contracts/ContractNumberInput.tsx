/**
 * src/components/contracts/ContractNumberInput.tsx
 * 
 * Auto-generated contract number input with manual override capability
 */

import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Edit2, RotateCcw, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useNextContractNumber } from '@/hooks/useContractNumbering';
import { formatContractDate } from '@/types/contract';
import type { ContractPrefix } from '@/types/contract';

interface ContractNumberInputProps {
  contractPrefix: ContractPrefix;
  value: {
    sequenceNumber: number | null;
    contractDate: string | null;
  };
  onChange: (value: { sequenceNumber: number; contractDate: string }) => void;
  disabled?: boolean;
}

export default function ContractNumberInput({
  contractPrefix,
  value,
  onChange,
  disabled = false,
}: ContractNumberInputProps) {
  const [isManualMode, setIsManualMode] = useState(false);
  const [date, setDate] = useState<Date>(
    value.contractDate ? new Date(value.contractDate) : new Date()
  );
  const [manualNumber, setManualNumber] = useState<number>(
    value.sequenceNumber || 1
  );

  // Fetch next available number
  const { data: nextNumber, isLoading } = useNextContractNumber(
    contractPrefix,
    date.toISOString().split('T')[0]
  );

  // Update parent when auto number is fetched
  useEffect(() => {
    if (!isManualMode && nextNumber && !value.sequenceNumber) {
      onChange({
        sequenceNumber: nextNumber.sequence_number,
        contractDate: nextNumber.contract_date,
      });
    }
  }, [nextNumber, isManualMode]);

  // Handle date change
  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;
    
    setDate(newDate);
    const isoDate = newDate.toISOString().split('T')[0];
    
    if (isManualMode) {
      onChange({
        sequenceNumber: manualNumber,
        contractDate: isoDate,
      });
    }
  };

  // Handle manual number change
  const handleManualNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value) || 0;
    setManualNumber(num);
    
    if (isManualMode) {
      onChange({
        sequenceNumber: num,
        contractDate: date.toISOString().split('T')[0],
      });
    }
  };

  // Enable manual mode
  const enableManualMode = () => {
    setIsManualMode(true);
    setManualNumber(value.sequenceNumber || nextNumber?.sequence_number || 1);
    onChange({
      sequenceNumber: manualNumber || nextNumber?.sequence_number || 1,
      contractDate: date.toISOString().split('T')[0],
    });
  };

  // Reset to auto mode
  const resetToAuto = () => {
    setIsManualMode(false);
    if (nextNumber) {
      onChange({
        sequenceNumber: nextNumber.sequence_number,
        contractDate: nextNumber.contract_date,
      });
    }
  };

  // Generate preview number
  const previewNumber = isManualMode
    ? `${contractPrefix}-${manualNumber}/${formatContractDate(date)}`
    : nextNumber?.contract_number || '...';

  const contractTypeName = {
    REC: 'Recruitment',
    PAR: 'Partnership',
    CON: 'Consultancy',
    SRV: 'Service',
  }[contractPrefix];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <Label className="text-sm font-semibold text-blue-900">
              Contract Number (Auto-Generated)
            </Label>
            <p className="text-xs text-blue-700 mt-1">
              {contractTypeName} Contract
            </p>
          </div>
          
          {!disabled && (
            <div className="flex gap-2">
              {isManualMode ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetToAuto}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset to Auto
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={enableManualMode}
                  className="text-xs"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit Manually
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Prefix (readonly) */}
          <div>
            <Label className="text-xs text-gray-600">Prefix</Label>
            <Input
              value={contractPrefix}
              disabled
              className="mt-1 bg-gray-100 font-mono font-semibold"
            />
          </div>

          {/* Sequential Number */}
          <div>
            <Label className="text-xs text-gray-600">
              Number {isLoading && '(loading...)'}
            </Label>
            <Input
              type="number"
              min="1"
              value={isManualMode ? manualNumber : nextNumber?.sequence_number || ''}
              onChange={handleManualNumberChange}
              disabled={!isManualMode || disabled || isLoading}
              className="mt-1 font-mono font-semibold"
              placeholder="1"
            />
          </div>

          {/* Date Picker */}
          <div className="col-span-2">
            <Label className="text-xs text-gray-600">Contract Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal mt-1"
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, 'dd.MM.yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <Label className="text-xs text-gray-600 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Contract Number Preview
          </Label>
          <div className="mt-2 text-2xl font-bold text-blue-900 font-mono">
            {previewNumber}
          </div>
          {!isManualMode && (
            <p className="text-xs text-blue-600 mt-1">
              This is the next available number
            </p>
          )}
        </div>
      </div>

      {/* Warning for manual mode */}
      {isManualMode && (
        <Alert>
          <AlertDescription className="text-xs">
            ⚠️ <strong>Manual mode enabled.</strong> Make sure this number doesn't conflict with existing contracts.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
