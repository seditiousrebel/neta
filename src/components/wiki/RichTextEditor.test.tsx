import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RichTextEditor } from './RichTextEditor';

describe('RichTextEditor', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly without crashing', () => {
    render(<RichTextEditor value="" onChange={mockOnChange} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('passes the value prop to the Textarea', () => {
    const testValue = "This is a test value.";
    render(<RichTextEditor value={testValue} onChange={mockOnChange} />);
    expect(screen.getByRole('textbox')).toHaveValue(testValue);
  });

  it('calls onChange prop when the Textarea value changes', () => {
    render(<RichTextEditor value="" onChange={mockOnChange} />);
    const textarea = screen.getByRole('textbox');
    const newValue = "New text entered.";
    fireEvent.change(textarea, { target: { value: newValue } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(newValue);
  });

  it('passes the placeholder prop to the Textarea', () => {
    const testPlaceholder = "Enter your rich text here...";
    render(<RichTextEditor value="" onChange={mockOnChange} placeholder={testPlaceholder} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', testPlaceholder);
  });
  
  it('uses default placeholder if none provided', () => {
    render(<RichTextEditor value="" onChange={mockOnChange} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Enter text...');
  });


  it('passes the disabled prop to the Textarea and makes it disabled', () => {
    render(<RichTextEditor value="" onChange={mockOnChange} disabled={true} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('is not disabled by default', () => {
    render(<RichTextEditor value="" onChange={mockOnChange} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).not.toBeDisabled();
  });
  
  it('applies custom className to the Textarea', () => {
    const customClass = "my-custom-editor-class";
    render(<RichTextEditor value="" onChange={mockOnChange} className={customClass} />);
    expect(screen.getByRole('textbox')).toHaveClass(customClass);
  });

  it('passes the id prop to the Textarea', () => {
    const testId = "my-rich-text-editor";
    render(<RichTextEditor value="" onChange={mockOnChange} id={testId} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', testId);
  });

  it('passes maxLength prop to the Textarea', () => {
    const maxLength = 100;
    render(<RichTextEditor value="" onChange={mockOnChange} maxLength={maxLength} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', String(maxLength));
  });
});
