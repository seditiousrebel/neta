import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditButton } from './EditButton';
import { Pencil } from 'lucide-react';

// Mock lucide-react specifically for the Pencil icon if needed, or generally
jest.mock('lucide-react', () => ({
  ...jest.requireActual('lucide-react'), // Import and retain default behavior
  Pencil: (props: any) => <svg data-testid="pencil-icon" {...props} />,
}));

// Mock the useMobile hook
jest.mock('@/hooks/use-mobile', () => ({
  useMobile: jest.fn(),
}));
const mockUseMobile = require('@/hooks/use-mobile').useMobile;

// Mock the Tooltip components from @radix-ui/react-tooltip via our UI component
// This is a basic mock. More complex interactions might need a more detailed mock.
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => asChild ? children : <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-provider">{children}</div>,
}));


describe('EditButton', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly without crashing', () => {
    mockUseMobile.mockReturnValue(false);
    render(<EditButton onClick={mockOnClick} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays the pencil icon', () => {
    mockUseMobile.mockReturnValue(false);
    render(<EditButton onClick={mockOnClick} />);
    expect(screen.getByTestId('pencil-icon')).toBeInTheDocument();
  });

  it('has the correct aria-label for accessibility', () => {
    mockUseMobile.mockReturnValue(false);
    render(<EditButton onClick={mockOnClick} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Edit this field');
  });

  it('calls the onClick prop when clicked', () => {
    mockUseMobile.mockReturnValue(false);
    render(<EditButton onClick={mockOnClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  describe('Tooltip', () => {
    it('renders TooltipProvider, Tooltip, TooltipTrigger and TooltipContent', () => {
      mockUseMobile.mockReturnValue(false);
      render(<EditButton onClick={mockOnClick} />);
      expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
      // TooltipContent might not be immediately visible in the DOM with basic mocks
      // We are testing its presence via the mock structure here.
      // For actual visibility on hover, more complex setup or e2e tests are better.
      expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
      expect(screen.getByText('Edit this field')).toBeInTheDocument(); // Check for tooltip text
    });
  });

  describe('Visibility based on useMobile hook and hover', () => {
    it('applies desktop visibility classes when useMobile is false', () => {
      mockUseMobile.mockReturnValue(false);
      render(<EditButton onClick={mockOnClick} />);
      const button = screen.getByRole('button');
      // Check for Tailwind classes. This can be brittle if class names change frequently.
      // Consider data-attributes for states if this becomes an issue.
      expect(button).toHaveClass('opacity-0');
      expect(button).toHaveClass('group-hover:opacity-100');
    });

    it('applies mobile visibility class when useMobile is true', () => {
      mockUseMobile.mockReturnValue(true);
      render(<EditButton onClick={mockOnClick} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-100');
      // Should not have desktop-specific opacity classes if mobile is active
      expect(button).not.toHaveClass('opacity-0');
      expect(button).not.toHaveClass('group-hover:opacity-100');
    });

     it('applies custom className', () => {
      mockUseMobile.mockReturnValue(false);
      const customClass = "my-custom-class";
      render(<EditButton onClick={mockOnClick} className={customClass} />);
      expect(screen.getByRole('button')).toHaveClass(customClass);
    });
  });
});
