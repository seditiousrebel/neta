// src/lib/supabase/contributions.test.ts
import { submitNewPoliticianContribution } from './contributions';
import { type PoliticianFormData } from '../../components/contribute/PoliticianForm';
import { supabase } from './client'; // Actual client, will be mocked

// Mock the Supabase client
jest.mock('./client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn(),
  },
}));

describe('submitNewPoliticianContribution', () => {
  const mockUserId = 'user-uuid-123';
  const mockPoliticianData: PoliticianFormData = {
    name: 'Test Politician',
    name_nepali: 'टेस्ट राजनीतिज्ञ',
    dob: '1980-01-01',
    gender: 'Male',
    photo_asset_id: 'asset-uuid-456',
    biography: 'A test biography.',
    education_details: '- BSc Computer Science, Test University (2000)\n- MSc Data Science, Another University (2002)',
    political_journey: '- Member of Parliament (2010-2015)\n- Minister of Technology (2016-2020)',
    criminal_records: [
      { id: 'cr-uuid-1', case_description: 'Defamation case', offense_date: '2019-05-10', court_name: 'District Court', case_status: 'Pending', sentence_details: '', relevant_laws: 'Penal Code Section 123' },
      { id: 'cr-uuid-2', case_description: 'Protest related charge', offense_date: '2021-01-15', court_name: 'High Court', case_status: 'Acquitted', sentence_details: 'Acquitted after trial', relevant_laws: 'Public Order Act' },
    ],
    asset_declarations: [
      { id: 'ad-uuid-1', year: 2022, description_of_assets: 'House in City X, Apartment in City Y', source_of_income: 'Salary, Rental Income' },
      { id: 'ad-uuid-2', year: 2023, description_of_assets: 'Stocks in Company A, Bonds', source_of_income: 'Dividends, Interest' },
    ],
    contact_information: { email: 'test@example.com', phone: '1234567890', address: '123 Test Street, Test City' },
    social_media_handles: { twitter: 'https://twitter.com/testpolitician', facebook: 'https://facebook.com/testpolitician', instagram: 'https://instagram.com/testpolitician' },
  };

  beforeEach(() => {
    (supabase.from as jest.Mock).mockClear();
    (supabase.insert as jest.Mock).mockClear();
  });

  it('should call supabase.insert with correct parameters on successful submission', async () => {
    const mockSuccessResponse = { data: [{ id: 'edit-uuid-789' }], error: null };
    (supabase.insert as jest.Mock).mockResolvedValueOnce(mockSuccessResponse);

    await submitNewPoliticianContribution(mockPoliticianData, mockUserId);

    expect(supabase.from).toHaveBeenCalledWith('pending_edits');
    expect(supabase.insert).toHaveBeenCalledWith([ // supabase client expects an array for insert
      {
        entity_type: 'Politician',
        entity_id: null, // For new politician, entity_id is null
        proposed_data: mockPoliticianData, // The whole form data
        proposer_id: mockUserId,
        status: 'Pending',
        change_reason: 'New politician profile submission.', // Added this field
      }
    ]);
  });

  it('should return success response data when submission is successful', async () => {
    const mockSuccessResponse = { data: [{ id: 'edit-uuid-789', status: 'Pending' }], error: null };
    (supabase.insert as jest.Mock).mockResolvedValueOnce(mockSuccessResponse);

    const result = await submitNewPoliticianContribution(mockPoliticianData, mockUserId);

    expect(result).toEqual(mockSuccessResponse);
  });

  it('should return error response when submission fails', async () => {
    const mockErrorResponse = { data: null, error: { message: 'Insert failed', code: 'DB001', details: '', hint: '' } };
    (supabase.insert as jest.Mock).mockResolvedValueOnce(mockErrorResponse);

    const result = await submitNewPoliticianContribution(mockPoliticianData, mockUserId);

    expect(result).toEqual(mockErrorResponse);
  });
});
