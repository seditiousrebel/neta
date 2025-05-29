
"use client";

import { useInfiniteQuery } from '@tanstack/react-query';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { PoliticianCardData, PoliticianFiltersState } from '@/types/entities';
import type { Database } from '@/types/supabase';

const ITEMS_PER_PAGE = 12;

interface FetchPoliticiansParams extends PoliticianFiltersState {
  pageParam?: number; // For infinite query, this is the offset or page number
}

const fetchPoliticians = async ({
  pageParam = 0, // Start with offset 0 for the first page
  searchTerm,
  partyId,
  // provinceId, // Add if province filter is implemented
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
        media_assets ( storage_path ),
        party_memberships ( is_active, parties ( id, name, abbreviation, media_assets ( storage_path ) ) ),
        politician_positions ( is_current, position_titles ( id, title ) ),
        politician_ratings ( vote_score )
      `,
      { count: 'exact' } // Request total count
    )
    .range(from, to)
    .order('name', { ascending: true });

  if (searchTerm) {
    query = query.textSearch('fts_vector', searchTerm, { type: 'plain', config: 'english' });
  }
  if (partyId && partyId.trim() !== '') { // Ensure partyId is not empty or just whitespace
    query = query.filter('party_memberships.parties.id', 'eq', partyId);
  }
  // if (provinceId && provinceId.trim() !== '') {
  //   query = query.eq('province_id', provinceId); // Assuming 'province_id' column on 'politicians'
  // }
  
  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching politicians (client-side hook). Message:', error.message, 'Details:', error.details);
    console.error('Full Supabase error object for client-side politicians fetch:', JSON.stringify(error, null, 2));
    throw new Error(error.message || 'Failed to fetch politicians');
  }
  
  const hasMore = (from + (data?.length || 0)) < (count || 0);
  
  return { 
    data: data || [], 
    nextPage: hasMore ? pageParam + 1 : null,
    totalCount: count 
  };
};

export const usePoliticians = (
  filters: PoliticianFiltersState,
  initialData?: { data: PoliticianCardData[], nextPage: number | null, totalCount: number | null }
) => {
  return useInfiniteQuery<{ data: PoliticianCardData[], nextPage: number | null, totalCount: number | null }, Error, { data: PoliticianCardData[], nextPage: number | null, totalCount: number | null }, any, number>({
    queryKey: ['politicians', filters],
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
