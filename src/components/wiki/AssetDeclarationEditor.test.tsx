import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssetDeclarationEditor, AssetDeclaration } from './AssetDeclarationEditor';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  PlusCircle: () => <div data-testid="plus-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Edit3: () => <div data-testid="edit-icon" />,
  Save: () => <div data-testid="save-icon" />,
  XCircle: () => <div data-testid="cancel-icon" />,
}));

// Mock crypto.randomUUID for predictable IDs
const mockUUID = 'mock-asset-uuid';
let uuidCount = 0;
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: () => `${mockUUID}-${uuidCount++}`,
}));

describe('AssetDeclarationEditor', () => {
  const mockOnChange = jest.fn();
  const currentYear = new Date().getFullYear();
  const initialDeclarations: AssetDeclaration[] = [
    { id: 'asset-1', year: 2022, description_of_assets: 'Land in Village', total_value_approx: 50000, source_of_income: 'Agriculture' },
    { id: 'asset-2', year: 2023, description_of_assets: 'Apartment in City', total_value_approx: 200000, source_of_income: 'Rent' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    uuidCount = 0; // Reset UUID counter
  });

  it('renders correctly with no declarations', () => {
    render(<AssetDeclarationEditor value={[]} onChange={mockOnChange} />);
    expect(screen.getByText('Add New Asset Declaration')).toBeInTheDocument();
  });

  it('renders correctly with initial declarations', () => {
    render(<AssetDeclarationEditor value={initialDeclarations} onChange={mockOnChange} />);
    expect(screen.getByText(/Land in Village/)).toBeInTheDocument();
    expect(screen.getByText(/Apartment in City/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /remove/i })).toHaveLength(initialDeclarations.length);
    expect(screen.getAllByTestId('edit-icon')).toHaveLength(initialDeclarations.length);
  });

  it('adds a new declaration when "Add New" button is clicked', () => {
    render(<AssetDeclarationEditor value={[]} onChange={mockOnChange} />);
    fireEvent.click(screen.getByText('Add New Asset Declaration'));
    
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const passedDeclarations = mockOnChange.mock.calls[0][0];
    expect(passedDeclarations).toHaveLength(1);
    expect(passedDeclarations[0].id).toBe(`${mockUUID}-0`);
    expect(passedDeclarations[0].year).toBe(currentYear); // Default to current year
    expect(passedDeclarations[0].description_of_assets).toBe('');
  });

  it('removes a declaration when "Remove" button is clicked', () => {
    render(<AssetDeclarationEditor value={initialDeclarations} onChange={mockOnChange} />);
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const passedDeclarations = mockOnChange.mock.calls[0][0];
    expect(passedDeclarations).toHaveLength(initialDeclarations.length - 1);
    expect(passedDeclarations.find((d: AssetDeclaration) => d.id === initialDeclarations[0].id)).toBeUndefined();
  });

  describe('Inline Editing', () => {
    it('switches to edit mode when "Edit" button is clicked', () => {
      render(<AssetDeclarationEditor value={initialDeclarations} onChange={mockOnChange} />);
      fireEvent.click(screen.getAllByTestId('edit-icon')[0].closest('button')!);

      const firstRecordCard = screen.getByText(/Land in Village/).closest('[class*="Card"]');
      expect(within(firstRecordCard!).getByLabelText(/Year/i)).toBeInTheDocument();
      expect(within(firstRecordCard!).getByLabelText(/Description of Assets/i)).toBeInTheDocument();
      expect(within(firstRecordCard!).getByRole('button', {name: /save/i})).toBeInTheDocument();
    });

    it('updates declaration fields and calls onChange on "Save"', () => {
      render(<AssetDeclarationEditor value={initialDeclarations} onChange={mockOnChange} />);
      fireEvent.click(screen.getAllByTestId('edit-icon')[0].closest('button')!);
      
      const firstRecordCard = screen.getByText(/Land in Village/).closest('[class*="Card"]');
      const descriptionInput = within(firstRecordCard!).getByLabelText(/Description of Assets/i);
      const newDescription = 'Updated Land Details';
      const yearInput = within(firstRecordCard!).getByLabelText(/Year/i);
      const newYear = 2024;

      fireEvent.change(descriptionInput, { target: { value: newDescription } });
      fireEvent.change(yearInput, { target: { value: String(newYear) } }); // Input type number needs string value

      fireEvent.click(within(firstRecordCard!).getByRole('button', {name: /save/i}));
      
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const passedDeclarations = mockOnChange.mock.calls[0][0];
      expect(passedDeclarations[0].description_of_assets).toBe(newDescription);
      expect(passedDeclarations[0].year).toBe(newYear); // Ensure it's saved as a number
      
      expect(screen.queryByRole('button', {name: /save/i})).not.toBeInTheDocument();
      expect(screen.getByText(newDescription)).toBeInTheDocument();
    });
    
    it('handles empty optional numeric fields correctly on Save', () => {
      render(<AssetDeclarationEditor value={initialDeclarations} onChange={mockOnChange} />);
      fireEvent.click(screen.getAllByTestId('edit-icon')[0].closest('button')!);
      
      const firstRecordCard = screen.getByText(/Land in Village/).closest('[class*="Card"]');
      const valueInput = within(firstRecordCard!).getByLabelText(/Approx. Total Value/i);

      fireEvent.change(valueInput, { target: { value: '' } }); // Empty the optional field
      fireEvent.click(within(firstRecordCard!).getByRole('button', {name: /save/i}));
      
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const passedDeclarations = mockOnChange.mock.calls[0][0];
      expect(passedDeclarations[0].total_value_approx).toBeUndefined();
    });


    it('reverts changes on "Cancel"', () => {
      render(<AssetDeclarationEditor value={initialDeclarations} onChange={mockOnChange} />);
      fireEvent.click(screen.getAllByTestId('edit-icon')[0].closest('button')!);
      
      const firstRecordCard = screen.getByText(/Land in Village/).closest('[class*="Card"]');
      const descriptionInput = within(firstRecordCard!).getByLabelText(/Description of Assets/i);
      const originalDescription = initialDeclarations[0].description_of_assets;

      fireEvent.change(descriptionInput, { target: { value: 'Temporary Asset Change' } });
      fireEvent.click(within(firstRecordCard!).getByRole('button', {name: /cancel/i}));
      
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', {name: /save/i})).not.toBeInTheDocument();
      expect(screen.getByText(originalDescription)).toBeInTheDocument();
    });
  });

  it('disables all interactive elements when disabled prop is true', () => {
    render(<AssetDeclarationEditor value={initialDeclarations} onChange={mockOnChange} disabled={true} />);
    expect(screen.getByText('Add New Asset Declaration').closest('button')).toBeDisabled();
    
    const { rerender } = render(<AssetDeclarationEditor value={[]} onChange={mockOnChange} disabled={true} />);
    expect(screen.getByText(/No asset declarations provided/i)).toBeInTheDocument();
  });

  it('disables inputs and buttons in edit mode when disabled prop is true', () => {
    const { rerender } = render(<AssetDeclarationEditor value={initialDeclarations} onChange={mockOnChange} />);
    fireEvent.click(screen.getAllByTestId('edit-icon')[0].closest('button')!); 

    rerender(<AssetDeclarationEditor value={initialDeclarations} onChange={mockOnChange} disabled={true} />);
    
    const firstRecordCard = screen.getByText(initialDeclarations[0].description_of_assets).closest('[class*="Card"]');
    expect(within(firstRecordCard!).getByLabelText(/Year/i)).toBeDisabled();
    expect(within(firstRecordCard!).getByLabelText(/Description of Assets/i)).toBeDisabled();
    expect(within(firstRecordCard!).getByRole('button', {name: /save/i})).toBeDisabled();
    expect(within(firstRecordCard!).getByRole('button', {name: /cancel/i})).toBeDisabled();
  });
});
