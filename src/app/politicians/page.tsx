
// src/app/politicians/page.tsx
import React, { Suspense } from 'react';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { PoliticianSummary, PartyFilterOption, ProvinceFilterOption } from '@/types/entities';
import PoliticianFilters from '@/components/politicians/PoliticianFilters';
import PoliticianList from '@/components/politicians/PoliticianList';
import PaginationControls from '@/components/ui/PaginationControls';
import { getPartyFilterOptions, getProvinceFilterOptions } from '@/lib/supabase/data';
import { Skeleton } from '@/components/ui/skeleton';
import { getPublicUrlForMediaAsset } from '@/lib/supabase/storage.server';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react'; // Import icon for the button

const ITEMS_PER_PAGE = 12;

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
        party_memberships!left(
            is_active,
            parties!left(
                id,
                name,
                abbreviation
            )
        ),
        politician_positions!left(
            is_current,
            position_titles!left(
                id,
                title
            )
        )
      `,
      { count: 'exact' }
    )
    .order('name', { ascending: true })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  if (searchQuery) {
    query = query.textSearch('fts_vector', searchQuery, { type: 'plain', config: 'english' });
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
    console.error(
      'Error fetching initial politicians. Message:', error.message,
      'Details:', error.details,
      'Hint:', error.hint,
      'Code:', error.code
    );
    if (error.message.includes("column politicians.province does not exist")) {
         console.error("Correcting: 'province' column was queried, but 'province_id' exists.");
    }
    return { politicians: [], count: 0 };
  }

  if (!rawPoliticians) {
    return { politicians: [], count: 0 };
  }

  const politiciansWithDetails = await Promise.all(
    rawPoliticians.map(async (p: any) => {
      let photoUrl: string | null = null;
      if (p.photo_asset_id) {
        photoUrl = await getPublicUrlForMediaAsset(String(p.photo_asset_id));
      }

      // Find the first active party membership that also has party details
      const activePartyMembership = Array.isArray(p.party_memberships)
        ? p.party_memberships.find((pm: any) => pm.is_active && pm.parties)
        : null;
      const currentPartyName = activePartyMembership?.parties?.name || 'N/A';
      
      // Find the first current position that also has position title details
      const currentPosition = Array.isArray(p.politician_positions)
        ? p.politician_positions.find((pp: any) => pp.is_current && pp.position_titles)
        : null;
      const currentPositionTitle = currentPosition?.position_titles?.title || 'N/A';
      
      const { data: votesData, error: votesError } = await supabase
        .from('entity_votes')
        .select('vote_type') // No count needed here, just the types for sum
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

  return { politicians: politiciansWithDetails, count };
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

  const isInitialLoadAndNoPoliticians = !searchParams?.q && 
                                !searchParams?.partyId && 
                                !searchParams?.provinceId && 
                                (!searchParams?.has_criminal_record || searchParams?.has_criminal_record === 'any') && 
                                count === 0;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
          Politician Directory
        </h1>
        <p className="text-muted-foreground mt-3 text-base sm:text-lg max-w-2xl mx-auto">
          Browse, search, and filter profiles of politicians. Help expand our database by contributing new profiles.
        </p>
      </header>

      <div className="mb-8 flex justify-center sm:justify-end">
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/contribute/politician">
            <PlusCircle className="mr-2 h-5 w-5" />
            Contribute New Politician
          </Link>
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg mb-6" />}>
        <PoliticianFilters initialParties={parties} initialProvinces={provinces} />
      </Suspense>
      
      {isInitialLoadAndNoPoliticians ? (
        <div className="text-center text-muted-foreground py-12">
          <p className="text-xl mb-2">No Politicians Found in the Database</p>
          <p className="mb-4">It looks like there are no politicians listed yet. Be the first to add one!</p>
          {/* The main button is now above filters. Could add a smaller one here if desired or remove this prompt's button */}
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
