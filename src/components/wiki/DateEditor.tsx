import React, { useState, useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarProps } from '@/components/ui/calendar'; // Assuming this is react-day-picker styled
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label'; // For BS date note
import type { EditorProps } from './EditModal'; // Import EditorProps type

export interface DateEditorProps extends EditorProps<string | undefined> {
  isBSDate?: boolean;
}

export function DateEditor({
  value, // ISO string or undefined
  onChange,
  disabled,
  placeholder, // Will be used for BS date input
  isBSDate = false,
  id,
  className,
}: DateEditorProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [inputValue, setInputValue] = useState<string>(''); // For user-friendly display or BS date input
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (value) {
      if (isBSDate) {
        setInputValue(value); // For BS, value is directly the input string
      } else {
        const parsedDate = parseISO(value);
        if (isValid(parsedDate)) {
          setSelectedDate(parsedDate);
          setInputValue(format(parsedDate, 'PPP')); // User-friendly format for AD dates
        } else {
          setSelectedDate(undefined);
          setInputValue(''); // Clear if invalid
        }
      }
    } else {
      setSelectedDate(undefined);
      setInputValue('');
    }
  }, [value, isBSDate]);

  const handleADDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      onChange(format(date, 'yyyy-MM-dd')); // Send ISO string back
      setInputValue(format(date, 'PPP'));
    } else {
      onChange(undefined); // Or an empty string, depending on desired behavior for clearing
      setInputValue('');
    }
    setPopoverOpen(false);
  };

  const handleBSDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTextValue = event.target.value;
    setInputValue(newTextValue);
    onChange(newTextValue); // Send raw text back
  };

  if (isBSDate) {
    return (
      <div className={cn("space-y-2", className)}>
        <Input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleBSDateChange}
          placeholder={placeholder || 'YYYY-MM-DD (BS)'}
          disabled={disabled}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          BS date entry. Validation and calendar for BS dates are future enhancements.
        </p>
      </div>
    );
  }

  // AD Date Picker
  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={"outline"}
          role="combobox"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {inputValue || <span>{placeholder || 'Pick a date'}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleADDateSelect}
          disabled={disabled}
          initialFocus
          // Optional: Add month/year navigation if needed and not default
          // captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear() + 5}
        />
      </PopoverContent>
    </Popover>
  );
}
