
"use client";

import { useInfiniteQuery } from '@tanstack/react-query';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { PoliticianCardData, PoliticianFiltersState } from '@/types/entities';
// import type { Database } from '@/types/supabase'; // Not strictly needed here

const ITEMS_PER_PAGE = 12;

interface FetchPoliticiansParams extends PoliticianFiltersState {
  pageParam?: number; 
}

const fetchPoliticians = async ({
  pageParam = 0, 
  searchTerm,
  partyId,
  provinceId, 
  hasCriminalRecord,
}: FetchPoliticiansParams): Promise<{ data: PoliticianCardData[], nextPage: number | null, totalCount: number | null }> => {
  const supabase = createSupabaseBrowserClient();
  const from = pageParam * ITEMS_PER_PAGE;
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
  } else if (hasCriminalRecord === 'no') {
    query = query.is('public_criminal_records', null);
  }
  
  const { data: politiciansWithoutScores, error, count } = await query;

  if (error) {
    console.error('Error fetching politicians (client-side hook). Message:', error.message, 'Details:', error.details);
    throw new Error(error.message || 'Failed to fetch politicians');
  }

   const politiciansWithScores = politiciansWithoutScores && politiciansWithoutScores.length > 0 ? await Promise.all(politiciansWithoutScores.map(async (p: any) => {
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
  
  const hasMore = (from + (politiciansWithScores?.length || 0)) < (count || 0);
  
  return { 
    data: politiciansWithScores as PoliticianCardData[], 
    nextPage: hasMore ? pageParam + 1 : null,
    totalCount: count 
  };
};

export const usePoliticians = (
  filters: PoliticianFiltersState,
  initialData?: { data: PoliticianCardData[], nextPage: number | null, totalCount: number | null }
) => {
  return useInfiniteQuery<{ data: PoliticianCardData[], nextPage: number | null, totalCount: number | null }, Error, { data: PoliticianCardData[], nextPage: number | null, totalCount: number | null }, any, number>({
    queryKey: ['politicians', filters], // Ensure all filter keys are part of the queryKey
    queryFn: ({ pageParam }) => fetchPoliticians({ ...filters, pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    initialData: initialData ? () => ({
        pages: [initialData],
        pageParams: [0],
    }) : undefined,
    refetchOnWindowFocus: false,
  });
};
