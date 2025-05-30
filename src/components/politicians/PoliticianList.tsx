
"use client";

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePoliticians } from '@/hooks/usePoliticians';
import PoliticianCard from './PoliticianCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { PoliticianSummary as PoliticianCardData } from '@/types/entities';

interface PoliticianListProps {
  initialPoliticians: PoliticianCardData[];
  initialTotalCount: number;
}

export default function PoliticianList({ initialPoliticians, initialTotalCount }: PoliticianListProps) {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const partyId = searchParams.get('partyId') || '';
  const provinceId = searchParams.get('provinceId') || '';
  const hasCriminalRecord = searchParams.get('has_criminal_record') || 'any';

  // Prepare initialData for useInfiniteQuery if initialPoliticians exist
  const preparedInitialData = (initialPoliticians && initialPoliticians.length > 0) ? {
    data: initialPoliticians,
    // Ensure nextPage is calculated correctly: it's the *index* of the next page
    // If 12 items were fetched and total is > 12, next page index is 1 (for page 2).
    nextPage: initialPoliticians.length < initialTotalCount ? 1 : null,
    totalCount: initialTotalCount,
  } : undefined;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading, // This reflects loading state from TanStack Query
    isError,
    error,
  } = usePoliticians(
    { searchTerm, partyId, provinceId, hasCriminalRecord },
    preparedInitialData // Pass the prepared initial data
  );

  const allPoliticians = data?.pages.flatMap(page => page.data) || [];
  // Use totalCount from the first page of data if available, otherwise fallback to initialTotalCount
  const currentTotalCount = data?.pages[0]?.totalCount ?? initialTotalCount;

  // Determine if we should show loading skeletons:
  // - isLoading is true (query is actively fetching for the first time)
  // - AND there's no data in allPoliticians yet (neither from initialData nor from a successful fetch)
  const showLoadingSkeletons = isLoading && allPoliticians.length === 0;

  if (showLoadingSkeletons) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-[400px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive">Error loading politicians: {error?.message}</p>;
  }

  if (allPoliticians.length === 0 && !isLoading) { // Ensure not to show "No politicians" while initial load might be happening
     return <p className="text-center text-muted-foreground py-8">No politicians found matching your criteria.</p>;
  }

  return (
    <section aria-labelledby="politician-list-heading">
      <h2 id="politician-list-heading" className="sr-only">
        List of Politicians
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Showing {allPoliticians.length} of {currentTotalCount ?? 0} politicians.
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allPoliticians.map((politician) => (
          <PoliticianCard key={politician.id} politician={politician} />
        ))}
      </div>
      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load More Politicians'}
          </Button>
        </div>
      )}
    </section>
  );
}
