import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditModal, EditModalProps, EditorProps } from './EditModal';
import { RichTextEditor } from './RichTextEditor';
import { DateEditor } from './DateEditor';

// Mock server actions
const mockSubmitPoliticianEdit = jest.fn();
const mockUpdatePoliticianDirectly = jest.fn();
jest.mock('@/lib/actions/politician.actions', () => ({
  submitPoliticianEdit: (...args: any[]) => mockSubmitPoliticianEdit(...args),
  updatePoliticianDirectly: (...args: any[]) => mockUpdatePoliticianDirectly(...args),
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
    // Setup default mock implementations for non-admin user
    mockUseAuth.mockReturnValue({ user: { id: 'user-test-id', role: 'User' } }); // Default to non-admin
    mockSubmitPoliticianEdit.mockResolvedValue({ success: true, message: 'Edit submitted!' });
    mockUpdatePoliticianDirectly.mockResolvedValue({ success: true, message: 'Admin update successful!' });
  });

  // Helper to render with specific props, especially for isAdmin
  const renderModal = (props: Partial<EditModalProps> = {}) => {
    return render(<EditModal {...defaultProps} {...props} />);
  };

  it('does not render when isOpen is false', () => {
    render(<EditModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true for non-admin', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(`Edit ${defaultProps.fieldLabel}`)).toBeInTheDocument();
    expect(screen.getByLabelText(defaultProps.fieldLabel!)).toHaveValue(defaultProps.currentValue as string);
    const reasonLabel = screen.getByText(/Change Reason/);
    expect(within(reasonLabel).getByText('*')).toBeInTheDocument(); // Required asterisk
    expect(screen.getByLabelText(/Change Reason/)).toBeRequired();
  });

  // ... (keep existing tests for Input Handling, Preview, basic Dynamic Editor Rendering, onClose)
  // Modify submission logic tests to be within non-admin and admin describe blocks

  describe('Non-Admin User Submission', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-test-id', role: 'User' } });
    });

    it('submit button is disabled if change reason is empty and value changed', () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: 'New Value' } });
      expect(screen.getByRole('button', { name: 'Submit Edit' })).toBeDisabled();
    });

    it('submit button is enabled when value changed and reason provided', () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: 'New Value' } });
      fireEvent.change(screen.getByLabelText(/Change Reason/), { target: { value: 'A reason' } });
      expect(screen.getByRole('button', { name: 'Submit Edit' })).toBeEnabled();
    });

    it('calls submitPoliticianEdit and not updatePoliticianDirectly', async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: 'New Name' } });
      fireEvent.change(screen.getByLabelText(/Change Reason/), { target: { value: 'Valid reason' } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit Edit' }));

      await waitFor(() => {
        expect(mockSubmitPoliticianEdit).toHaveBeenCalledWith(
          defaultProps.politicianId,
          defaultProps.fieldName,
          'New Name',
          'Valid reason',
          'user-test-id'
        );
        expect(mockUpdatePoliticianDirectly).not.toHaveBeenCalled();
      });
      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }));
    });
     it('handles failed submission from submitPoliticianEdit', async () => {
      mockSubmitPoliticianEdit.mockResolvedValueOnce({ success: false, message: 'Submission failed error' });
      renderModal();
      fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: 'Another New Value' } });
      fireEvent.change(screen.getByLabelText(/Change Reason/), { target: { value: 'Test reason' } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit Edit' }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive', description: 'Submission failed error' }));
      });
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Admin User Scenarios', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: { id: 'admin-user-id', role: 'Admin' } });
    });

    it('renders Change Reason as optional for admin', () => {
      renderModal({ isAdmin: true });
      const reasonLabel = screen.getByText(/Change Reason/);
      expect(within(reasonLabel).getByText('(Optional)')).toBeInTheDocument();
      expect(screen.getByLabelText(/Change Reason/)).not.toBeRequired();
    });

    it('submit button is enabled for admin if value changed, even with empty reason', () => {
      renderModal({ isAdmin: true });
      fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: 'Admin New Value' } });
      // No change reason provided
      expect(screen.getByRole('button', { name: 'Submit Edit' })).toBeEnabled();
    });

    it('calls updatePoliticianDirectly and not submitPoliticianEdit for admin', async () => {
      const adminNewValue = 'Admin Direct Update Value';
      const adminReason = 'Admin reason';
      renderModal({ isAdmin: true });

      fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: adminNewValue } });
      fireEvent.change(screen.getByLabelText(/Change Reason/), { target: { value: adminReason } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit Edit' }));

      await waitFor(() => {
        expect(mockUpdatePoliticianDirectly).toHaveBeenCalledWith(
          defaultProps.politicianId,
          defaultProps.fieldName,
          adminNewValue,
          'admin-user-id',
          adminReason
        );
        expect(mockSubmitPoliticianEdit).not.toHaveBeenCalled();
      });
      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success', title: "Admin Edit Successful" }));
    });
    
    it('calls updatePoliticianDirectly with default reason if admin provides none', async () => {
      const adminNewValue = 'Admin Direct Update - No Reason';
      renderModal({ isAdmin: true });

      fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: adminNewValue } });
      // No change reason
      fireEvent.click(screen.getByRole('button', { name: 'Submit Edit' }));

      await waitFor(() => {
        expect(mockUpdatePoliticianDirectly).toHaveBeenCalledWith(
          defaultProps.politicianId,
          defaultProps.fieldName,
          adminNewValue,
          'admin-user-id',
          "" // Empty string for reason if not "Admin direct update." as default in action
        );
      });
    });

    it('handles failed submission from updatePoliticianDirectly', async () => {
      mockUpdatePoliticianDirectly.mockResolvedValueOnce({ success: false, message: 'Admin update failed error' });
      renderModal({ isAdmin: true });

      fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: 'Attempted Admin Value' } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit Edit' }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive', title: 'Admin Edit Failed', description: 'Admin update failed error' }));
      });
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });
  
  // Keep other tests like Dynamic Editor Rendering, user not logged in, etc., ensuring they are compatible with the new structure.
  // Example: Test for user not logged in (should behave same for admin/non-admin attempt)
  it('handles user not logged in when attempting submit', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    renderModal(); // isAdmin prop doesn't matter if user is null
    fireEvent.change(screen.getByLabelText(defaultProps.fieldLabel!), { target: { value: "New Value" } });
    fireEvent.change(screen.getByLabelText(/Change Reason/), { target: { value: "A reason" } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Edit' }));

    await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive', title: "Authentication Error" }));
    });
    expect(mockSubmitPoliticianEdit).not.toHaveBeenCalled();
    expect(mockUpdatePoliticianDirectly).not.toHaveBeenCalled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  // ... (rest of the tests like Dynamic Editor Rendering, onClose for cancel button, etc.)
  // Ensure existing tests for dynamic editor rendering are still valid.
  // No changes needed for them if they don't depend on admin/non-admin logic for rendering part.
  describe('Dynamic Editor Rendering (No change from previous)', () => {
    it('renders Input for fieldType="text"', () => {
      renderModal({ fieldType: 'text' });
      expect(screen.getByLabelText(defaultProps.fieldLabel!)).toBeInstanceOf(HTMLInputElement);
    });

    it('renders Textarea for fieldType="textarea"', () => {
      renderModal({ fieldType: 'textarea' });
      expect(screen.getByLabelText(defaultProps.fieldLabel!)).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('renders RichTextEditor (mocked) for fieldType="richtext"', () => {
      renderModal({ fieldType: 'richtext', editorComponent: RichTextEditor as any });
      expect(screen.getByTestId('mock-richtext-editor')).toBeInTheDocument();
    });
  });

   it('calls onClose when cancel button is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

});
