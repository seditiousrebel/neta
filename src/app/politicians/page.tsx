
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { PoliticianCardData } from '@/types/entities';
import PoliticianList from '@/components/politicians/PoliticianList';
import PoliticianFilters from '@/components/politicians/PoliticianFilters';
import type { Database } from '@/types/supabase';

const ITEMS_PER_PAGE = 12;

async function fetchInitialPoliticians(
  searchParams: { [key: string]: string | string[] | undefined }
): Promise<{ politicians: PoliticianCardData[]; count: number | null }> {
  const supabase = createSupabaseServerClient();
  
  const page = parseInt(searchParams?.page as string || '1');
  const searchTerm = searchParams?.search as string || '';
  const partyId = searchParams?.partyId as string || '';
  // const provinceId = searchParams?.provinceId as string || ''; // Add if you have province_id on politicians

  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from('politicians')
    .select<string, { data: PoliticianCardData[], count: number | null }>( // Type assertion for count
      `
        id,
        name,
        bio,
        fts_vector,
        media_assets ( storage_path ),
        party_memberships ( is_active, parties ( id, name, abbreviation, media_assets ( storage_path ) ) ),
        politician_positions ( is_current, position_titles ( id, title ) ),
        politician_ratings ( vote_score )
      `,
      { count: 'exact' } // Request total count for pagination
    )
    .range(from, to)
    .order('name', { ascending: true });

  if (searchTerm) {
    query = query.textSearch('fts_vector', searchTerm, { type: 'plain' });
  }
  if (partyId) {
    // This assumes you want politicians who have a membership (any, active or not) with this party.
    // Adjust if `politicians` table has a direct `current_party_id` FK.
    query = query.filter('party_memberships.parties.id', 'eq', partyId);
  }
  // if (provinceId) {
  //   query = query.eq('province_id', provinceId); // Assuming 'province_id' column exists
  // }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching initial politicians:', error);
    return { politicians: [], count: 0 };
  }
  // console.log('[Server] Fetched Politicians:', data?.length, 'Count:', count);
  return { politicians: data || [], count };
}


export default async function PoliticiansPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { politicians: initialPoliticians, count: totalCount } = await fetchInitialPoliticians(searchParams);

  // Fetch filter options (parties, provinces) server-side for PoliticianFilters
  const supabase = createSupabaseServerClient();
  const { data: partiesData, error: partiesError } = await supabase
    .from('parties')
    .select('id, name')
    .order('name');
  
  // Assuming a 'provinces' table
  const { data: provincesData, error: provincesError } = await supabase
    .from('provinces')
    .select('id, name')
    .order('name');

  if (partiesError) console.error("Error fetching parties for filters:", partiesError.message);
  if (provincesError) console.error("Error fetching provinces for filters:", provincesError.message);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Politician Directory</h1>
        <p className="text-muted-foreground">Browse and search for politicians.</p>
      </header>
      
      <PoliticianFilters 
        initialParties={partiesData || []} 
        initialProvinces={provincesData || []} 
      />

      <PoliticianList 
        initialPoliticians={initialPoliticians} 
        initialTotalCount={totalCount || 0} 
      />
    </div>
  );
}
