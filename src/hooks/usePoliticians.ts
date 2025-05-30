// src/hooks/usePoliticians.ts
"use client";

import { useInfiniteQuery } from '@tanstack/react-query';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { PoliticianSummary as PoliticianCardData, PoliticianFiltersState } from '@/types/entities';
import { getPublicUrlForMediaAsset } from '@/lib/uploadUtils'; // Using client-side version for general media assets

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
        name_nepali,
        photo_asset_id,
        public_criminal_records,
        party_memberships!inner(
            is_active,
            parties!inner(
                id,
                name,
                abbreviation
            )
        ),
        politician_positions!inner(
            is_current,
            position_titles!inner(
                id,
                title
            )
        )
      `,
      { count: 'exact' }
    )
    .eq('party_memberships.is_active', true)
    .eq('politician_positions.is_current', true)
    .limit(1, { foreignTable: 'party_memberships' })
    .limit(1, { foreignTable: 'politician_positions' })
    .order('name', { ascending: true }) // Changed to order by name
    .range(from, to);

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
  
  const { data: rawPoliticians, error, count } = await query;

  if (error) {
    console.error('Error fetching politicians (client-side hook). Message:', error.message, 'Details:', error.details);
    throw new Error(error.message || 'Failed to fetch politicians');
  }

  if (!rawPoliticians) {
    return { data: [], nextPage: null, totalCount: 0 };
  }
  
  const politiciansWithDetails = await Promise.all(
    rawPoliticians.map(async (p: any) => {
      let photoUrl: string | null = null;
      if (p.photo_asset_id) {
         // Using client-side suitable version of getPublicUrl
        photoUrl = await getPublicUrlForMediaAsset(String(p.photo_asset_id));
      }

      const activePartyMembership = p.party_memberships?.find((pm: any) => pm.is_active);
      const currentPartyName = activePartyMembership?.parties?.name || 'N/A';
      
      const currentPosition = p.politician_positions?.find((pp: any) => pp.is_current);
      const currentPositionTitle = currentPosition?.position_titles?.title || 'N/A';
      
      // Fetch aggregate vote score from entity_votes for this politician
      const { data: votesData, error: votesError } = await supabase
        .from('entity_votes')
        .select('vote_type') // Select only vote_type for summing
        .eq('entity_id', p.id)
        .eq('entity_type', 'Politician');

      let vote_score = 0;
      if (votesError) {
        console.warn(`Error fetching votes for politician ${p.id}: ${votesError.message}`);
      } else if (votesData) {
        vote_score = votesData.reduce((acc, vote) => acc + (vote.vote_type || 0), 0);
      }

      return {
        id: String(p.id),
        name: p.name,
        name_nepali: p.name_nepali,
        photo_url: photoUrl,
        current_party_name: currentPartyName,
        current_position_title: currentPositionTitle,
        public_criminal_records: p.public_criminal_records,
        vote_score: vote_score,
      };
    })
  );
  
  const hasMore = (from + politiciansWithDetails.length) < (count || 0);
  
  return { 
    data: politiciansWithDetails, 
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
