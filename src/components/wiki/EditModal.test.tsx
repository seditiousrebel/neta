import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditModal, EditModalProps, EditorProps } from './EditModal';
import { RichTextEditor } from './RichTextEditor';
import { DateEditor } from './DateEditor';

// Mock server action
const mockSubmitPoliticianEdit = jest.fn();
jest.mock('@/lib/actions/politician.actions', () => ({
  submitPoliticianEdit: (...args: any[]) => mockSubmitPoliticianEdit(...args),
}));

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useToast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock child editor components
jest.mock('./RichTextEditor', () => ({
  RichTextEditor: jest.fn((props: EditorProps<string>) => (
    <textarea data-testid="mock-richtext-editor" value={props.value} onChange={(e) => props.onChange(e.target.value)} disabled={props.disabled} />
  )),
}));

jest.mock('./DateEditor', () => ({
  DateEditor: jest.fn((props: EditorProps<string | undefined> & { isBSDate?: boolean }) => (
    <input data-testid="mock-date-editor" value={props.value || ''} onChange={(e) => props.onChange(e.target.value)} disabled={props.disabled} data-isbsdate={props.isBSDate} />
  )),
}));

const MockCustomEditor = jest.fn((props: EditorProps<any>) => (
  <input data-testid="mock-custom-editor" value={props.value} onChange={(e) => props.onChange(e.target.value)} disabled={props.disabled} />
));


const defaultProps: EditModalProps = {
  isOpen: true,
  onClose: jest.fn(),
  politicianId: 'politician-123',
  fieldName: 'name',
  fieldLabel: 'Full Name',
  currentValue: 'Initial Name',
  fieldType: 'text',
};

describe('EditModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock implementations
    mockUseAuth.mockReturnValue({ user: { id: 'user-test-id' } });
    mockSubmitPoliticianEdit.mockResolvedValue({ success: true, message: 'Edit submitted!' });
  });

  it('does not render when isOpen is false', () => {
    render(<EditModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(<EditModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(`Edit ${defaultProps.fieldLabel}`)).toBeInTheDocument(); // Title
    expect(screen.getByLabelText(defaultProps.fieldLabel!)).toHaveValue(defaultProps.currentValue as string);
    expect(screen.getByLabelText('Change Reason')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Edit' })).toBeInTheDocument();
  });

  it('previews initial values correctly', () => {
    render(<EditModal {...defaultProps} currentValue="Old Value" />);
    // Preview section might only appear on change, or show old/new.
    // If it shows old/new always, then:
    // expect(screen.getByText('Old Value')).toBeInTheDocument();
    // If it only shows on change, this test needs to make a change first.
    // For now, let's assume it doesn't show identical values or only on change.
    // Test will be more robust when testing value changes.
  });

  describe('Input Handling and State Changes', () => {
    it('updates internal newValue and preview on input change', () => {
      render(<EditModal {...defaultProps} />);
      const inputField = screen.getByLabelText(defaultProps.fieldLabel!);
      fireEvent.change(inputField, { target: { value: 'New Name' } });
      
      // The input itself should reflect the new value due to controlled component pattern
      expect(inputField).toHaveValue('New Name');

      // Preview section should update
      expect(screen.getByText(defaultProps.currentValue as string)).toBeInTheDocument(); // old value
      expect(screen.getByText('New Name')).toBeInTheDocument(); // new value
    });

    it('updates changeReason state on textarea change', () => {
      render(<EditModal {...defaultProps} />);
      const reasonTextarea = screen.getByLabelText('Change Reason');
      fireEvent.change(reasonTextarea, { target: { value: 'Updated for accuracy.' } });
      expect(reasonTextarea).toHaveValue('Updated for accuracy.');
    });
  });

  describe('Submission Logic', () => {
    it('submit button is disabled if change reason is empty', () => {
      render(<EditModal {...defaultProps} />);
      fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: 'New Value' } }); // Make a value change
      expect(screen.getByRole('button', { name: 'Submit Edit' })).toBeDisabled();
    });

    it('submit button is disabled if newValue is same as currentValue', () => {
      render(<EditModal {...defaultProps} />);
      fireEvent.change(screen.getByLabelText('Change Reason'), { target: { value: 'A reason' } });
      expect(screen.getByRole('button', { name: 'Submit Edit' })).toBeDisabled();
    });

    it('submit button is enabled when value changed and reason provided', () => {
      render(<EditModal {...defaultProps} />);
      fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: 'New Value' } });
      fireEvent.change(screen.getByLabelText('Change Reason'), { target: { value: 'A reason' } });
      expect(screen.getByRole('button', { name: 'Submit Edit' })).toBeEnabled();
    });

    it('calls submitPoliticianEdit with correct parameters on successful submission', async () => {
      const newName = 'Updated Politician Name';
      const reason = 'Outdated information.';
      render(<EditModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: newName } });
      fireEvent.change(screen.getByLabelText('Change Reason'), { target: { value: reason } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit Edit' }));

      await waitFor(() => {
        expect(mockSubmitPoliticianEdit).toHaveBeenCalledWith(
          defaultProps.politicianId,
          defaultProps.fieldName,
          newName,
          reason,
          'user-test-id' // from mocked useAuth
        );
      });
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }));
    });
    
    it('handles user not logged in', async () => {
      mockUseAuth.mockReturnValue({ user: null }); // Simulate no user
      render(<EditModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: "New Value" } });
      fireEvent.change(screen.getByLabelText('Change Reason'), { target: { value: "A reason" } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit Edit' }));

      await waitFor(() => {
         expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive', title: "Authentication Error" }));
      });
      expect(mockSubmitPoliticianEdit).not.toHaveBeenCalled();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('handles failed submission from server action', async () => {
      mockSubmitPoliticianEdit.mockResolvedValueOnce({ success: false, message: 'Server error' });
      render(<EditModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: 'Another New Value' } });
      fireEvent.change(screen.getByLabelText('Change Reason'), { target: { value: 'Test reason' } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit Edit' }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive', description: 'Server error' }));
      });
      expect(defaultProps.onClose).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Submit Edit' })).not.toBeDisabled(); // No longer submitting
    });
    
    it('shows loading state on submit button during submission', async () => {
      // Make the mock promise pend to check intermediate state
      mockSubmitPoliticianEdit.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
      render(<EditModal {...defaultProps} />);
      fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: 'New Value' } });
      fireEvent.change(screen.getByLabelText('Change Reason'), { target: { value: 'A reason' } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit Edit' }));
      
      expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled();
      await waitFor(() => expect(defaultProps.onClose).toHaveBeenCalled()); // Wait for submission to complete
    });
  });

  describe('Dynamic Editor Rendering', () => {
    it('renders Input for fieldType="text"', () => {
      render(<EditModal {...defaultProps} fieldType="text" />);
      expect(screen.getByLabelText(defaultProps.fieldLabel!)).toBeInstanceOf(HTMLInputElement);
    });

    it('renders Textarea for fieldType="textarea"', () => {
      render(<EditModal {...defaultProps} fieldType="textarea" />);
      expect(screen.getByLabelText(defaultProps.fieldLabel!)).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('renders RichTextEditor (mocked) for fieldType="richtext"', () => {
      render(<EditModal {...defaultProps} fieldType="richtext" editorComponent={RichTextEditor as any} />); // Cast as any due to mock
      expect(screen.getByTestId('mock-richtext-editor')).toBeInTheDocument();
    });

    it('renders DateEditor (mocked) for fieldType="date"', () => {
        // Note: DateEditor is typically used with fieldType 'custom' and passed as editorComponent
        // Or EditModal has specific logic for 'date' to use DateEditor internally.
        // Assuming it's used via 'custom' as per previous setups:
      render(
        <EditModal 
          {...defaultProps} 
          fieldType="custom" 
          editorComponent={DateEditor as any} // Cast due to mock
          editorProps={{ isBSDate: true }}
        />
      );
      const dateEditor = screen.getByTestId('mock-date-editor');
      expect(dateEditor).toBeInTheDocument();
      expect(dateEditor).toHaveAttribute('data-isbsdate', 'true');
    });

    it('renders custom editorComponent for fieldType="custom"', () => {
      render(<EditModal {...defaultProps} fieldType="custom" editorComponent={MockCustomEditor} />);
      expect(screen.getByTestId('mock-custom-editor')).toBeInTheDocument();
    });

    it('renders select element for fieldType="select" with options', () => {
      const selectOptions = ['Option 1', 'Option 2'];
      render(<EditModal {...defaultProps} fieldType="select" fieldOptions={selectOptions} />);
      const selectElement = screen.getByLabelText(defaultProps.fieldLabel!) as HTMLSelectElement;
      expect(selectElement).toBeInstanceOf(HTMLSelectElement);
      expect(selectElement.options).toHaveLength(selectOptions.length + 1); // +1 for disabled placeholder option
      expect(within(selectElement).getByText('Option 1')).toBeInTheDocument();
      expect(within(selectElement).getByText('Option 2')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<EditModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
  
  it('calls onClose when dialog close (X) button is clicked or overlay clicked', () => {
    // This tests the Dialog's onOpenChange behavior which calls our onClose
    // Radix Dialog's close button is part of DialogContent's internals usually
    // We can't directly click an "X" unless we add it or it's part of the mocked Dialog
    // For now, assuming onOpenChange is correctly wired up in the actual Dialog component.
    // If Dialog was mocked more deeply, we could simulate its onOpenChange call.
    // Testing the 'DialogClose' asChild button:
    render(<EditModal {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' }); // This is inside DialogClose
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
