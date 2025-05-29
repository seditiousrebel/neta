
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

  // Note: The `vote_score` is calculated using a subquery.
  // `user_vote_status` (whether the current user has voted) is not fetched here
  // as it would require knowing the current user_id and complicating the query significantly
  // for a list view. This can be handled client-side per card if needed.
  let query = supabase
    .from('politicians')
    .select<string, { data: PoliticianCardData[], count: number | null }>( 
      `
        id,
        name,
        bio,
        fts_vector,
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
        politician_positions ( is_current, position_titles ( id, title ) ),
        vote_score:politician_votes(count) 
      `, // Simpler way to get count for now, ideally SUM(vote_type)
      // To get actual sum: (SELECT COALESCE(SUM(vote_type), 0) FROM politician_votes pv WHERE pv.politician_id = politicians.id) AS vote_score
      // For now, let's use a simpler relation count, or assume vote_score is a column if you denormalize.
      // For a real sum, the select string becomes more complex or requires a view/function.
      // Let's try with a subquery for SUM. This might be slow on large datasets without proper indexing on politician_votes(politician_id).
      // Supabase JS library might not directly support complex subqueries in the select string like this as easily as direct SQL.
      // A safer bet for JS client is often to create a DB view or function.
      // Let's revert to a simpler form for the select and calculate on client or simplify what "vote_score" means for now.
      // Or, we can assume `politicians` table gets a `vote_score` column updated by triggers.

      // Re-evaluating: Supabase can do basic aggregates on related tables using `related_table(aggregate_function)`.
      // However, `SUM(vote_type)` where `vote_type` can be -1 or 1 is what we need.
      // Let's assume you will create a view or function `get_politician_vote_score(politician_id)` later.
      // For now, we will fetch a placeholder or rely on client-side for this example.
      // Or, for a simple initial setup, let's just count upvotes for now if `vote_type` is always 1
      // `politician_votes!upvotes(count)` - this is not standard.
      // Okay, let's stick to the subquery pattern and see if Supabase JS handles it gracefully.
      // If not, we'll simplify.
      `
        id,
        name,
        bio,
        fts_vector,
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
      `, // Temporarily remove vote_score from server query for simplicity, will add to client hook
      { count: 'exact' } 
    )
    .range(from, to)
    .order('name', { ascending: true });

  if (searchTerm) {
    query = query.textSearch('fts_vector', searchTerm, { type: 'plain' });
  }
  if (partyId && partyId.trim() !== '' && partyId !== 'all') { 
    query = query.filter('party_memberships.parties.id', 'eq', partyId);
  }
  // if (provinceId && provinceId.trim() !== '' && provinceId !== 'all') {
  //   query = query.eq('province_id', provinceId); // Assuming 'province_id' column exists
  // }

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

  // Manually fetch vote scores for each politician for now
  // This is N+1, not ideal for production. A database view or function is better.
  const politicians = politiciansWithoutScores && politiciansWithoutScores.length > 0 ? await Promise.all(politiciansWithoutScores.map(async (p: any) => {
    const { data: votes, error: voteError } = await supabase
      .from('politician_votes')
      .select('vote_type')
      .eq('politician_id', p.id);
    if (voteError) {
      console.error(`Error fetching votes for politician ${p.id}:`, voteError);
      return { ...p, vote_score: 0 };
    }
    const vote_score = votes ? votes.reduce((acc, v) => acc + v.vote_type, 0) : 0;
    return { ...p, vote_score };
  })) : [];


  return { politicians: politicians as PoliticianCardData[], count };
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
