// src/components/politicians/PoliticianList.tsx
"use client";

import PoliticianCard from './PoliticianCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { PoliticianSummary as PoliticianCardData } from '@/types/entities';

interface PoliticianListProps {
  politicians: PoliticianCardData[];
  isLoading: boolean; // True if initial load or fetching more while some data is present
  isError: boolean;
  error: Error | null;
  totalCount: number;
}

export default function PoliticianList({ 
  politicians, 
  isLoading, 
  isError, 
  error,
  totalCount
}: PoliticianListProps) {

  // Show skeletons only if it's the very initial load and no politicians are displayed yet.
  // If isLoading is true but politicians array has items, it means we are loading MORE, so don't show full skeletons.
  if (isLoading && politicians.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-[400px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError && politicians.length === 0) { // Only show error if no data at all
    return <p className="text-destructive text-center py-8">Error loading politicians: {error?.message}</p>;
  }
  
  // This message is for when filters result in no matches, but database might not be empty.
  // The "truly empty database" message is handled in the parent PoliticiansPageClient.
  if (politicians.length === 0 && !isLoading) { 
     return <p className="text-center text-muted-foreground py-8">No politicians found matching your criteria.</p>;
  }

  return (
    <section aria-labelledby="politician-list-heading">
      <h2 id="politician-list-heading" className="sr-only">
        List of Politicians
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Showing {politicians.length} of {totalCount} politicians.
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {politicians.map((politician) => (
          <PoliticianCard key={politician.id} politician={politician} />
        ))}
      </div>
      {/* Load More button is now handled by the parent PoliticiansPageClient */}
    </section>
  );
}
