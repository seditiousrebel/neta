
"use client";

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePoliticians } from '@/hooks/usePoliticians';
import { PoliticianCard } from './PoliticianCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { PoliticianCardData } from '@/types/entities';

interface PoliticianListProps {
  initialPoliticians: PoliticianCardData[];
  initialTotalCount: number;
}

export default function PoliticianList({ initialPoliticians, initialTotalCount }: PoliticianListProps) {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const partyId = searchParams.get('partyId') || '';
  // const provinceId = searchParams.get('provinceId') || '';

  // Prepare initial data for useInfiniteQuery
  const preparedInitialData = {
    data: initialPoliticians,
    nextPage: initialPoliticians.length < initialTotalCount ? 1 : null, // if more data, next page is 1 (0-indexed)
    totalCount: initialTotalCount,
  };
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = usePoliticians(
    { searchTerm, partyId /*, provinceId */ },
    (initialPoliticians && initialPoliticians.length > 0) || searchTerm || partyId ? undefined : preparedInitialData 
    // ^ Only use initialData if no filters are applied on first client load, to avoid stale data display
    // Or more simply, if this component receives initial data, it means SSR happened for current filters.
    // The hook needs initialData in a specific format { pages: [initialPage], pageParams: [initialPageParam] }
  );

  const allPoliticians = data?.pages.flatMap(page => page.data) || [];
  const currentTotalCount = data?.pages[0]?.totalCount ?? initialTotalCount;

  if (isLoading && (!allPoliticians || allPoliticians.length === 0) && !initialPoliticians.length) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-[350px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive">Error loading politicians: {error?.message}</p>;
  }
  
  if (!allPoliticians.length && !isLoading) {
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
