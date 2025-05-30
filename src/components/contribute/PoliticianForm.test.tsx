// src/components/contribute/PoliticianForm.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PoliticianForm from './PoliticianForm';

jest.mock('@/components/upload/PhotoUpload', () => ({
  __esModule: true,
  default: jest.fn(({ onUploadComplete }) => {
    React.useEffect(() => {
      // onUploadComplete('mock-photo-asset-id-from-form-tests');
    }, [onUploadComplete]);
    return <div data-testid="mock-photo-upload">Mocked PhotoUpload</div>;
  }),
}));

describe('PoliticianForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders essential form fields', () => {
    render(<PoliticianForm onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/Name \(English\) \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of Birth \(BS, YYYY-MM-DD\) \*/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select gender/i })).toBeInTheDocument(); 
    expect(screen.getByTestId('mock-photo-upload')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Politician Data/i })).toBeInTheDocument();
  });

  it('shows validation errors for required fields when submitted empty', async () => {
    render(<PoliticianForm onSubmit={mockOnSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: /Submit Politician Data/i }));

    expect(await screen.findByText('Name must be at least 2 characters.')).toBeInTheDocument();
    expect(await screen.findByText('Date must be YYYY-MM-DD')).toBeInTheDocument();
    expect(await screen.findByText(/Required|Invalid enum value/i)).toBeInTheDocument(); 
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with form data when valid data is submitted', async () => {
    const user = userEvent.setup();
    const defaultTestData = {
        contact_information: { email: '', phone: '', address: ''},
        social_media_handles: { twitter: '', facebook: '', instagram: ''}
    };
    render(<PoliticianForm onSubmit={mockOnSubmit} isLoading={false} defaultValues={defaultTestData} />);
    
    await user.type(screen.getByLabelText(/Name \(English\) \*/i), 'Valid Name');
    await user.type(screen.getByLabelText(/Date of Birth \(BS, YYYY-MM-DD\) \*/i), '2050-01-01');
    
    await user.click(screen.getByRole('button', {name: /Select gender/i})); 
    await user.click(await screen.findByText('Male')); 

    await user.type(screen.getByLabelText(/Name \(Nepali\)/i), 'वैध नाम');
    await user.type(screen.getByLabelText(/Detailed Biography/i), 'This is a biography.');
    await user.type(screen.getByLabelText(/Email Address/i), 'test@example.com');

    await user.click(screen.getByRole('button', { name: /Submit Politician Data/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Valid Name',
        dob: '2050-01-01',
        gender: 'Male',
        name_nepali: 'वैध नाम',
        biography: 'This is a biography.',
        contact_information: expect.objectContaining({
            email: 'test@example.com'
        })
      }));
    });
  });
});
