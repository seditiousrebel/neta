// src/lib/supabase/contributions.test.ts
import { submitPolitician, PoliticianData } from './contributions';
import { supabase } from './client'; // Actual client, will be mocked

// Mock the Supabase client
jest.mock('./client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn(),
  },
}));

describe('submitPolitician', () => {
  const mockUserId = 'user-uuid-123';
  const mockPoliticianData: PoliticianData = {
    name: 'Test Politician',
    dob: '2050-01-01',
    gender: 'Male',
    photo_asset_id: 'asset-uuid-456',
    biography: 'A test biography.',
    name_nepali: 'टेस्ट राजनीतिज्ञ',
    education_details: '[{"degree": "PhD"}]', // JSON string
    political_journey: '[{"role": "Minister"}]', // JSON string
    criminal_records: 'None',
    asset_declarations: '[{"asset": "House"}]', // JSON string
    contact_information: { email: 'test@example.com', phone: '123', address: 'Test Address' },
    social_media_handles: { twitter: 'https://twitter.com/test', facebook: 'https://facebook.com/test', instagram: 'https://instagram.com/test' },
  };

  beforeEach(() => {
    (supabase.from as jest.Mock).mockClear();
    (supabase.insert as jest.Mock).mockClear();
  });

  it('should call supabase.insert with correct parameters on successful submission', async () => {
    const mockSuccessResponse = { data: [{ id: 'edit-uuid-789' }], error: null };
    (supabase.insert as jest.Mock).mockResolvedValueOnce(mockSuccessResponse);

    await submitPolitician(mockPoliticianData, mockUserId);

    expect(supabase.from).toHaveBeenCalledWith('pending_edits');
    expect(supabase.insert).toHaveBeenCalledWith({
      entity_type: 'Politician',
      entity_id: null,
      proposed_data: {
        ...mockPoliticianData,
      },
      proposer_id: mockUserId,
      status: 'Pending',
    });
  });

  it('should return success response data when submission is successful', async () => {
    const mockSuccessResponse = { data: [{ id: 'edit-uuid-789', status: 'Pending' }], error: null };
    (supabase.insert as jest.Mock).mockResolvedValueOnce(mockSuccessResponse);

    const result = await submitPolitician(mockPoliticianData, mockUserId);

    expect(result).toEqual(mockSuccessResponse);
  });

  it('should return error response when submission fails', async () => {
    const mockErrorResponse = { data: null, error: { message: 'Insert failed', code: 'DB001' } };
    (supabase.insert as jest.Mock).mockResolvedValueOnce(mockErrorResponse);

    const result = await submitPolitician(mockPoliticianData, mockUserId);

    expect(result).toEqual(mockErrorResponse);
  });
});
