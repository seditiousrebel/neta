
import React, { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getPublicUrlForMediaAsset } from '@/lib/supabase/storage.server';
import type { PoliticianSummary, PartyFilterOption, ProvinceFilterOption } from '@/types/entities';
import PoliticianFilters from '@/components/politicians/PoliticianFilters';
import PoliticianList from '@/components/politicians/PoliticianList';
import PaginationControls from '@/components/ui/PaginationControls';
import { getPartyFilterOptions, getProvinceFilterOptions } from '@/lib/supabase/data'; // Import new helpers
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 12; // Define items per page for SSR

async function fetchInitialPoliticians(
  searchParams?: {
    q?: string;
    page?: string;
    partyId?: string;
    provinceId?: string;
    has_criminal_record?: 'yes' | 'no' | 'any' | string;
  }
): Promise<{ politicians: PoliticianSummary[]; count: number | null }> {
  const supabase = createSupabaseServerClient();
  const searchQuery = searchParams?.q || '';
  const currentPage = Number(searchParams?.page) || 1;
  const partyId = searchParams?.partyId || '';
  const provinceId = searchParams?.provinceId || '';
  const hasCriminalRecord = searchParams?.has_criminal_record || 'any';

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  let query = supabase
    .from('politicians')
    .select(
      `
        id,
        name,
        name_nepali,
        photo_asset_id,
        public_criminal_records,
        current_party_name:party_memberships!inner(
            parties!inner(name)
        ),
        current_position_title:politician_positions!inner(
            position_titles!inner(title)
        )
      `,
      { count: 'exact' }
    )
    .eq('party_memberships.is_active', true) // Ensure only active party membership
    .eq('politician_positions.is_current', true) // Ensure only current position
    .limit(1, { foreignTable: 'party_memberships' }) // Get only one active party
    .limit(1, { foreignTable: 'politician_positions' }) // Get only one current position
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);


  if (searchQuery) {
    query = query.textSearch('fts_vector', searchQuery, { type: 'plain', config: 'english' });
  }
  if (partyId && partyId.trim() !== '' && partyId !== 'all') {
    query = query.filter('party_memberships.party_id', 'eq', partyId);
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
    console.error(
      'Error fetching initial politicians. Message:', error.message,
      'Details:', error.details,
      'Hint:', error.hint,
      'Code:', error.code
    );
    return { politicians: [], count: 0 };
  }

  if (!rawPoliticians) {
    return { politicians: [], count: 0 };
  }

  const politicians = await Promise.all(
    rawPoliticians.map(async (p: any) => {
      let photoUrl: string | null = null;
      if (p.photo_asset_id) {
        photoUrl = await getPublicUrlForMediaAsset(String(p.photo_asset_id));
      }

      // Extract nested data correctly
      const current_party_name = Array.isArray(p.current_party_name) && p.current_party_name.length > 0 && p.current_party_name[0].parties
        ? p.current_party_name[0].parties.name
        : 'N/A';
      
      const current_position_title = Array.isArray(p.current_position_title) && p.current_position_title.length > 0 && p.current_position_title[0].position_titles
        ? p.current_position_title[0].position_titles.title
        : 'N/A';
      
      // Fetch vote score
      const { data: votesData, error: votesError } = await supabase
        .from('politician_votes')
        .select('vote_type', { count: 'exact' })
        .eq('politician_id', p.id);

      let vote_score = 0;
      if (votesError) {
        console.warn(`Error fetching votes for politician ${p.id}: ${votesError.message}`);
      } else if (votesData) {
        vote_score = votesData.reduce((acc, vote) => acc + vote.vote_type, 0);
      }

      return {
        id: String(p.id),
        name: p.name,
        name_nepali: p.name_nepali,
        photo_url: photoUrl,
        current_party_name: current_party_name,
        current_position_title: current_position_title,
        public_criminal_records: p.public_criminal_records,
        vote_score: vote_score,
      };
    })
  );

  return { politicians, count };
}


async function fetchInitialPoliticiansFilterOptions(): Promise<{
  parties: PartyFilterOption[];
  provinces: ProvinceFilterOption[];
}> {
  const parties = await getPartyFilterOptions();
  const provinces = await getProvinceFilterOptions();
  return { parties, provinces };
}


export default async function PoliticiansPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    page?: string;
    partyId?: string;
    provinceId?: string;
    has_criminal_record?: 'yes' | 'no' | 'any' | string;
    view?: 'grid' | 'list';
  };
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const { politicians, count } = await fetchInitialPoliticians(searchParams);
  const { parties, provinces } = await fetchInitialPoliticiansFilterOptions();
  const totalPages = count !== null ? Math.ceil(count / ITEMS_PER_PAGE) : 0;

  const paramsForPagination = new URLSearchParams();
  if (searchParams?.q) paramsForPagination.set('q', searchParams.q);
  if (searchParams?.partyId) paramsForPagination.set('partyId', searchParams.partyId);
  if (searchParams?.provinceId) paramsForPagination.set('provinceId', searchParams.provinceId);
  if (searchParams?.has_criminal_record) paramsForPagination.set('has_criminal_record', searchParams.has_criminal_record);
  if (searchParams?.view) paramsForPagination.set('view', searchParams.view);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
          Politician Directory
        </h1>
        <p className="text-muted-foreground mt-3 text-base sm:text-lg max-w-2xl mx-auto">
          Browse, search, and filter profiles of politicians.
        </p>
      </header>

      <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg mb-6" />}>
        <PoliticianFilters initialParties={parties} initialProvinces={provinces} />
      </Suspense>
      
      <Suspense fallback={
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-8">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
            <Skeleton key={index} className="h-[350px] w-full rounded-lg" />
          ))}
        </div>
      }>
        <PoliticianList initialPoliticians={politicians} initialTotalCount={count ?? 0} />
      </Suspense>

      {count !== null && totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalCount={count}
          itemsPerPage={ITEMS_PER_PAGE}
          basePath="/politicians"
          currentSearchParams={paramsForPagination}
        />
      )}
    </div>
  );
}
