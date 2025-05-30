import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DateEditor } from './DateEditor';
import { format, parseISO } from 'date-fns'; // Used for checking displayed format

// Mock lucide-react for CalendarIcon
jest.mock('lucide-react', () => ({
  ...jest.requireActual('lucide-react'),
  Calendar: (props: any) => <svg data-testid="calendar-icon" {...props} />,
}));

// Mock UI components
jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: { children: React.ReactNode, open?: boolean, onOpenChange?: (open: boolean) => void }) => (
    <div data-testid="popover" data-open={open} onClick={() => onOpenChange?.(!open)}>{children}</div>
  ),
  PopoverTrigger: ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => asChild ? children : <div data-testid="popover-trigger">{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-content">{children}</div>,
}));

// Mock Calendar component
const mockOnSelect = jest.fn();
jest.mock('@/components/ui/calendar', () => ({
  Calendar: (props: { selected?: Date; onSelect: (date?: Date) => void; disabled?: boolean, initialFocus?: boolean }) => (
    <div data-testid="calendar">
      <button onClick={() => props.onSelect(new Date(2023, 0, 15))}>Select Jan 15, 2023</button>
      {/* Add a button to simulate clearing the date for testing purposes */}
      <button onClick={() => props.onSelect(undefined)}>Clear Date</button>
    </div>
  ),
}));


describe('DateEditor', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Popover's "open" state if necessary, though the mock is simple
  });

  describe('AD Date Mode (isBSDate=false or undefined)', () => {
    it('renders a button as PopoverTrigger', () => {
      render(<DateEditor value={undefined} onChange={mockOnChange} />);
      expect(screen.getByRole('button', { name: /pick a date/i })).toBeInTheDocument();
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    });

    it('displays placeholder if no value is provided', () => {
        render(<DateEditor value={undefined} onChange={mockOnChange} placeholder="Select event date" />);
        expect(screen.getByRole('button', { name: /select event date/i })).toBeInTheDocument();
    });
    
    it('displays formatted initial ISO value in the button', () => {
      const initialIsoDate = '2023-03-10';
      render(<DateEditor value={initialIsoDate} onChange={mockOnChange} />);
      // Check for formatted date, PPP format is 'Mar 10, 2023'
      expect(screen.getByRole('button', { name: format(parseISO(initialIsoDate), 'PPP') })).toBeInTheDocument();
    });

    it('opens Popover and shows Calendar on trigger button click', async () => {
      render(<DateEditor value={undefined} onChange={mockOnChange} />);
      const triggerButton = screen.getByRole('button', { name: /pick a date/i });
      
      // Check initial state of popover (mocked)
      const popover = screen.getByTestId('popover');
      expect(popover).toHaveAttribute('data-open', 'false');

      fireEvent.click(triggerButton);
      
      await waitFor(() => {
        // Popover open state is managed internally by component state via onOpenChange
        // Our mock needs to reflect this if we want to assert on 'data-open'
        // For simplicity, check if calendar (which is inside PopoverContent) is visible
         expect(screen.getByTestId('calendar')).toBeInTheDocument();
      });
    });

    it('calls onChange with ISO date string when a date is selected from Calendar', async () => {
      render(<DateEditor value={undefined} onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /pick a date/i })); // Open popover

      await waitFor(() => {
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
      });

      // Simulate selecting 'Jan 15, 2023' using the button in mocked Calendar
      const selectDateButton = screen.getByRole('button', { name: 'Select Jan 15, 2023' });
      fireEvent.click(selectDateButton);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('2023-01-15'); // ISO format

      // Also check if the button text updates
      await waitFor(() => {
        expect(screen.getByRole('button', { name: format(new Date(2023, 0, 15), 'PPP') })).toBeInTheDocument();
      });
    });
    
    it('calls onChange with undefined when date is cleared from Calendar', async () => {
        render(<DateEditor value={'2023-01-15'} onChange={mockOnChange} />);
        fireEvent.click(screen.getByRole('button', { name: format(new Date(2023,0,15), 'PPP') })); // Open popover

        await waitFor(() => expect(screen.getByTestId('calendar')).toBeInTheDocument());
        
        const clearDateButton = screen.getByRole('button', { name: 'Clear Date' });
        fireEvent.click(clearDateButton);

        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange).toHaveBeenCalledWith(undefined);
        
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /pick a date/i })).toBeInTheDocument();
        });
    });

    it('disables the button and Calendar when disabled prop is true', () => {
      render(<DateEditor value={undefined} onChange={mockOnChange} disabled={true} />);
      expect(screen.getByRole('button')).toBeDisabled();
      // To test if Calendar is disabled, our mock would need to accept and reflect the disabled prop.
      // For now, we assume the prop is passed down.
    });
  });

  describe('BS Date Mode (isBSDate=true)', () => {
    it('renders an Input type="text"', () => {
      render(<DateEditor value="" onChange={mockOnChange} isBSDate={true} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('displays placeholder and note for BS date input', () => {
      render(<DateEditor value="" onChange={mockOnChange} isBSDate={true} placeholder="YYYY-MM-DD (Bikram Sambat)" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'YYYY-MM-DD (Bikram Sambat)');
      expect(screen.getByText('BS date entry. Validation and calendar for BS dates are future enhancements.')).toBeInTheDocument();
    });
    
    it('uses default placeholder if none provided for BS date input', () => {
        render(<DateEditor value="" onChange={mockOnChange} isBSDate={true} />);
        expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'YYYY-MM-DD (BS)');
    });

    it('calls onChange with raw text value when typing in BS input', () => {
      render(<DateEditor value="" onChange={mockOnChange} isBSDate={true} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '2080-01-05' } });
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('2080-01-05');
    });
    
    it('displays initial value in BS input', () => {
        const initialBsDate = "2079-12-15";
        render(<DateEditor value={initialBsDate} onChange={mockOnChange} isBSDate={true} />);
        expect(screen.getByRole('textbox')).toHaveValue(initialBsDate);
    });

    it('disables the input when disabled prop is true for BS dates', () => {
      render(<DateEditor value="" onChange={mockOnChange} isBSDate={true} disabled={true} />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });
   it('applies custom className', () => {
      const customClass = "my-custom-date-editor";
      render(<DateEditor value={undefined} onChange={mockOnChange} className={customClass} />);
      // For AD dates, className is on the Button
      expect(screen.getByRole('button')).toHaveClass(customClass);
      
      // For BS dates, className is on the div wrapper
      const { rerender } = render(<DateEditor value="" onChange={mockOnChange} isBSDate={true} className={customClass}/>);
      expect(screen.getByRole('textbox').parentElement).toHaveClass(customClass); // parentElement is the div
  });

  it('passes id prop to the main interactive element', () => {
    const testId = "my-date-editor";
    // AD Mode
    const { rerender } = render(<DateEditor value={undefined} onChange={mockOnChange} id={testId} />);
    expect(screen.getByRole('button')).toHaveAttribute('id', testId);

    // BS Mode
    rerender(<DateEditor value="" onChange={mockOnChange} isBSDate={true} id={testId} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', testId);
  });
});
