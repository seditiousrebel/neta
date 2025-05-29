
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { PoliticianCardData, PartyFilterOption, ProvinceFilterOption } from '@/types/entities';
import PoliticianList from '@/components/politicians/PoliticianList';
import PoliticianFilters from '@/components/politicians/PoliticianFilters';
// import type { Database } from '@/types/supabase'; // Not strictly needed here

const ITEMS_PER_PAGE = 12;

async function fetchInitialPoliticians(
  searchParams: { [key: string]: string | string[] | undefined }
): Promise<{ politicians: PoliticianCardData[]; count: number | null }> {
  const supabase = createSupabaseServerClient();
  
  const page = parseInt(searchParams?.page as string || '1');
  const searchTerm = searchParams?.search as string || '';
  const partyId = searchParams?.partyId as string || '';
  const provinceId = searchParams?.provinceId as string || '';
  const hasCriminalRecord = searchParams?.hasCriminalRecord as string || 'any';


  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from('politicians')
    .select(
      `
        id,
        name,
        bio,
        fts_vector,
        public_criminal_records,
        media_assets ( storage_path ),
        party_memberships (
          is_active,
          parties (
            id,
            name,
            abbreviation,
            media_assets:media_assets!parties_logo_asset_id_fkey ( storage_path )
          )
        ),
        politician_positions ( is_current, position_titles ( id, title ) )
      `,
      { count: 'exact' }
    )
    .range(from, to)
    .order('name', { ascending: true });

  if (searchTerm) {
    query = query.textSearch('fts_vector', searchTerm, { type: 'plain', config: 'english' });
  }
  if (partyId && partyId.trim() !== '' && partyId !== 'all') { 
    query = query.filter('party_memberships.parties.id', 'eq', partyId);
  }
  if (provinceId && provinceId.trim() !== '' && provinceId !== 'all') {
    query = query.eq('province_id', parseInt(provinceId)); 
  }
  if (hasCriminalRecord === 'yes') {
    query = query.not('public_criminal_records', 'is', null);
    // To also exclude empty strings, you'd need a more complex filter or a DB function/view
    // query = query.not('public_criminal_records', 'eq', ''); // This might not work as expected with nulls
  } else if (hasCriminalRecord === 'no') {
    query = query.is('public_criminal_records', null);
    // To also include empty strings as "no record", this logic would need to be adjusted
    // query = query.or('public_criminal_records.is.null,public_criminal_records.eq.')
  }


  const { data: politiciansWithoutScores, error, count } = await query;

  if (error) {
    console.error(
      'Error fetching initial politicians. Message:', error.message, 
      'Details:', error.details, 
      'Hint:', error.hint, 
      'Code:', error.code
    );
    console.error('Full Supabase error object for initial politicians fetch:', JSON.stringify(error, null, 2));
    return { politicians: [], count: 0 };
  }
  
  const politiciansWithScores = politiciansWithoutScores && politiciansWithoutScores.length > 0 ? await Promise.all(politiciansWithoutScores.map(async (p: any) => {
    const { data: votes, error: voteError } = await supabase
      .from('politician_votes')
      .select('vote_type', { count: 'exact' }) // Request count of votes as well
      .eq('politician_id', p.id);

    if (voteError) {
      console.error(`Error fetching votes for politician ${p.id}:`, voteError);
      return { ...p, vote_score: 0 };
    }
    // Summing vote_type: 1 for upvote, -1 for downvote
    const vote_score = votes ? votes.reduce((acc, v) => acc + v.vote_type, 0) : 0;
    return { ...p, vote_score };
  })) : [];


  return { politicians: politiciansWithScores as PoliticianCardData[], count };
}


export default async function PoliticiansPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { politicians: initialPoliticians, count: totalCount } = await fetchInitialPoliticians(searchParams);

  const supabase = createSupabaseServerClient();
  const { data: partiesData, error: partiesError } = await supabase
    .from('parties')
    .select('id, name')
    .order('name');
  
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
