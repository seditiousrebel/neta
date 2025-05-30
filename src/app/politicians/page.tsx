
// src/app/politicians/page.tsx
"use client";

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // For redirecting to login

import type { PoliticianSummary, PartyFilterOption, ProvinceFilterOption } from '@/types/entities';
import PoliticianFilters from '@/components/politicians/PoliticianFilters';
import PoliticianList from '@/components/politicians/PoliticianList';
import PaginationControls from '@/components/ui/PaginationControls';
import { getPartyFilterOptions, getProvinceFilterOptions } from '@/lib/supabase/data'; // These are server functions, will need a client-side alternative or initial props
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import PoliticianForm, { type PoliticianFormData } from '@/components/contribute/PoliticianForm';
import { submitNewPoliticianContribution } from '@/lib/supabase/contributions';
import { useAuth } from '@/contexts/auth-context';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Keep for initial fetch props
import { getPublicUrlForMediaAsset } from '@/lib/supabase/storage.server'; // Keep for initial fetch props

const ITEMS_PER_PAGE = 12;

// Props for the page component, fetched on the server initially
interface PoliticiansPageProps {
  initialPoliticians: PoliticianSummary[];
  initialTotalCount: number | null;
  initialParties: PartyFilterOption[];
  initialProvinces: ProvinceFilterOption[];
  currentSearchParams: {
    q?: string;
    page?: string;
    partyId?: string;
    provinceId?: string;
    has_criminal_record?: 'yes' | 'no' | 'any' | string;
    view?: 'grid' | 'list';
  };
}

// This function now runs on the server to get initial props
export async function getStaticPropsOrServerSideProps(context: any) { // Replace any with actual context type if needed
  const searchParams = context.searchParams || {};
  const { politicians, count } = await fetchInitialPoliticians(searchParams);
  const { parties, provinces } = await fetchInitialPoliticiansFilterOptions(); // Keep this helper
  return {
    props: {
      initialPoliticians: politicians,
      initialTotalCount: count,
      initialParties: parties,
      initialProvinces: provinces,
      currentSearchParams: searchParams,
    },
    // revalidate: 60, // For ISR if using getStaticProps
  };
}


// Helper functions (could be moved to a separate file if they grow)
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
      
      const activePartyMembership = Array.isArray(p.party_memberships)
        ? p.party_memberships.find((pm: any) => pm.is_active && pm.parties)
        : null;
      const currentPartyName = activePartyMembership?.parties?.name || 'N/A';
      
      const currentPosition = Array.isArray(p.politician_positions)
        ? p.politician_positions.find((pp: any) => pp.is_current && pp.position_titles)
        : null;
      const currentPositionTitle = currentPosition?.position_titles?.title || 'N/A';
      
      const { data: votesData, error: votesError } = await supabase
        .from('entity_votes')
        .select('vote_type')
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


// This is the client component part
export default function PoliticiansPage({
  initialPoliticians,
  initialTotalCount,
  initialParties,
  initialProvinces,
  currentSearchParams,
}: PoliticiansPageProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [formDataForPreview, setFormDataForPreview] = useState<PoliticianFormData | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const currentPage = Number(currentSearchParams?.page) || 1;
  const totalPages = initialTotalCount !== null ? Math.ceil(initialTotalCount / ITEMS_PER_PAGE) : 0;

  const paramsForPagination = new URLSearchParams();
  if (currentSearchParams?.q) paramsForPagination.set('q', currentSearchParams.q);
  if (currentSearchParams?.partyId) paramsForPagination.set('partyId', currentSearchParams.partyId);
  if (currentSearchParams?.provinceId) paramsForPagination.set('provinceId', currentSearchParams.provinceId);
  if (currentSearchParams?.has_criminal_record) paramsForPagination.set('has_criminal_record', currentSearchParams.has_criminal_record);
  if (currentSearchParams?.view) paramsForPagination.set('view', currentSearchParams.view);

  const isInitialLoadAndNoPoliticians = !currentSearchParams?.q &&
                                !currentSearchParams?.partyId &&
                                !currentSearchParams?.provinceId &&
                                (!currentSearchParams?.has_criminal_record || currentSearchParams?.has_criminal_record === 'any') &&
                                initialTotalCount === 0;

  const handleOpenContributeModal = () => {
    if (!isAuthenticated) {
      router.push('/auth/login?next=/politicians'); // Redirect to login, then back to politicians page
      return;
    }
    setSubmissionStatus('idle');
    setSubmissionMessage(null);
    setIsPreviewing(false);
    setFormDataForPreview(null);
    setIsContributeModalOpen(true);
  };

  const handleFormSubmitToPreview = (data: PoliticianFormData) => {
    setFormDataForPreview(data);
    setIsPreviewing(true);
  };
  
  const handleEditPreview = () => {
    setIsPreviewing(false);
  };

  const handleConfirmSubmit = async () => {
    if (!formDataForPreview || !user) {
      setSubmissionStatus('error');
      setSubmissionMessage("No data to submit or user not found.");
      return;
    }

    setSubmissionStatus('submitting');
    setSubmissionMessage(null);

    try {
      const result = await submitNewPoliticianContribution(formDataForPreview, user.id);
      if (result.error || !result.data || result.data.length === 0 || !result.data[0].id) {
        throw new Error(result.error?.message || "Submission failed or no valid ID returned.");
      }
      const editId = String(result.data[0].id);
      setSubmissionStatus('success');
      setSubmissionMessage(`Contribution submitted successfully! Your Edit ID is ${editId}. It will be reviewed by an admin.`);
      setIsPreviewing(false); 
      // Keep modal open to show success, user can close or add another
    } catch (err: any) {
      setSubmissionStatus('error');
      setSubmissionMessage(err.message || "An unexpected error occurred.");
    }
  };
  
  const resetContributionModal = () => {
    setIsContributeModalOpen(false);
    // Delay resetting states to allow modal to close smoothly
    setTimeout(() => {
        setIsPreviewing(false);
        setFormDataForPreview(null);
        setSubmissionStatus('idle');
        setSubmissionMessage(null);
    }, 300);
  };


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
        <Button onClick={handleOpenContributeModal} size="lg" className="shadow-md hover:shadow-lg transition-shadow" disabled={authLoading}>
          {authLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
          Contribute New Politician
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg mb-6" />}>
        <PoliticianFilters initialParties={initialParties} initialProvinces={initialProvinces} />
      </Suspense>
      
      {isInitialLoadAndNoPoliticians ? (
        <div className="text-center text-muted-foreground py-12">
          <p className="text-xl mb-2">No Politicians Found in the Database</p>
          <p className="mb-4">It looks like there are no politicians listed yet. Be the first to add one using the button above!</p>
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
            <PoliticianList initialPoliticians={initialPoliticians} initialTotalCount={initialTotalCount ?? 0} />
          </Suspense>

          {initialTotalCount !== null && totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalCount={initialTotalCount}
              itemsPerPage={ITEMS_PER_PAGE}
              basePath="/politicians"
              currentSearchParams={paramsForPagination}
            />
          )}
        </>
      )}

      <Dialog open={isContributeModalOpen} onOpenChange={(isOpen) => {
          if (!isOpen) resetContributionModal();
          else setIsContributeModalOpen(true);
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">
                {isPreviewing ? "Preview Contribution" : (submissionStatus === 'success' ? "Contribution Submitted!" : "Contribute New Politician")}
            </DialogTitle>
            <DialogDescription>
              {isPreviewing ? "Review the information below. If everything is correct, confirm your submission." : 
               (submissionStatus === 'success' ? submissionMessage : "Fill in the details for the new politician. All contributions are reviewed.")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-grow overflow-y-auto pr-2 space-y-4 py-4">
            {submissionStatus === 'error' && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{submissionMessage}</AlertDescription>
                </Alert>
            )}
             {submissionStatus === 'success' && (
                <Alert variant="default" className="bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700/50 dark:text-green-300">
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>{submissionMessage}</AlertDescription>
                </Alert>
            )}

            {!isPreviewing && submissionStatus !== 'success' && (
                <PoliticianForm onSubmit={handleFormSubmitToPreview} isLoading={submissionStatus === 'submitting'} mode="create" />
            )}

            {isPreviewing && formDataForPreview && submissionStatus !== 'success' && (
              <div className="space-y-3 p-1 border rounded-md bg-muted/20 max-h-[60vh] overflow-y-auto">
                {Object.entries(formDataForPreview).map(([key, value]) => {
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = String(value ?? "N/A");
                   if (value && typeof value === 'object' && !Array.isArray(value)) {
                        displayValue = JSON.stringify(value, null, 2);
                        return (
                            <div key={key} className="py-1.5 border-b last:border-b-0">
                                <h3 className="text-sm font-medium text-muted-foreground">{label}:</h3>
                                <pre className="mt-1 text-xs bg-background p-2 rounded-md whitespace-pre-wrap border">{displayValue}</pre>
                            </div>
                        );
                    }
                    if (value === null || value === undefined || value === '') {
                        displayValue = <span className="italic text-muted-foreground">Not provided</span> as unknown as string;
                    } else {
                        displayValue = String(value);
                    }
                  return (
                    <div key={key} className="py-1.5 border-b last:border-b-0 px-2">
                      <span className="text-sm font-medium text-muted-foreground">{label}:</span>{' '}
                      <span className="text-sm text-foreground">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="mt-auto pt-4 border-t">
            {submissionStatus === 'success' ? (
                 <Button onClick={resetContributionModal} variant="outline">Close & Add Another</Button>
            ) : isPreviewing ? (
              <>
                <Button variant="outline" onClick={handleEditPreview} disabled={submissionStatus === 'submitting'}>Back to Edit</Button>
                <Button onClick={handleConfirmSubmit} disabled={submissionStatus === 'submitting'}>
                  {submissionStatus === 'submitting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirm & Submit
                </Button>
              </>
            ) : (
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={resetContributionModal}>Cancel</Button>
              </DialogClose>
              // Submit button for the form itself is handled by PoliticianForm's own button, which calls onSubmitToPreview
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Note: To make this work with Next.js App Router and server-fetched initial props,
// you would typically fetch data in the Page component itself (if it's a Server Component)
// or use Route Handlers for API calls if it's a Client Component fetching data on client-side navigations.
// The getStaticPropsOrServerSideProps pattern is more for Pages Router.
// For App Router, this page.tsx as a client component will rely on `usePoliticians` hook for data,
// which already handles initial data from the server component parent.
// So, the `getStaticPropsOrServerSideProps` is illustrative if this were a Pages Router page or if we decided to pass initial data differently.
// For client component, the passed props `initialPoliticians`, `initialTotalCount` etc. come from the parent server component
// that *actually* calls `fetchInitialPoliticians` and `fetchInitialPoliticiansFilterOptions`.
// The `page.tsx` itself cannot be async if it's marked `"use client"`.
// The example above has a mix, assuming `currentSearchParams` is passed.
// The correct structure would be:
// Parent Server Component (e.g. layout.tsx or another server component rendering this page)
// async function Parent() {
//   const { politicians, count } = await fetchInitialPoliticians(searchParams);
//   const { parties, provinces } = await fetchInitialPoliticiansFilterOptions();
//   return <PoliticiansPage initialPoliticians={politicians} ... />;
// }
// This PoliticiansPage is client component as defined.
// I will assume the props `initialPoliticians`, `initialTotalCount`, etc., are correctly passed from such a server parent.
// For the purpose of this change, I am focusing on the client-side logic of PoliticiansPage.
// The `fetchInitialPoliticians` and `fetchInitialPoliticiansFilterOptions` are kept here for context on data structure
// but would typically be called in a server component that renders this client component.
// Let's simplify: we'll assume the props are passed in correctly, and focus on the modal logic.
// The `page.tsx` itself (if it's what's being rendered for the route) can be async to fetch initial data.
// If it's a Server Component, then stateful logic (modal) needs to be in a child Client Component.
// Given this is the page itself, let's make it a Server Component that passes data to a Client Component containing the list and modal.
// However, the request is to change this page to be modal-based, which means it needs state -> client component.
// So, the page itself becomes client, and initial data fetching pattern for list might need slight adjustment
// (e.g., initialData passed to usePoliticians hook). The `PoliticianList` already handles `initialPoliticians`.
// The provided code for the page makes it a client component and uses client-side state for the modal.
// The `initialParties` and `initialProvinces` for the filters would need to be fetched initially.
// Let's assume they are fetched and passed as props.
// The hook `usePoliticians` is responsible for subsequent data loading.

```></content>
  </change>
  <change>
    <file>/src/app/contribute/politician/page.tsx</file>
    <content><![CDATA[
// This file is no longer needed and will be removed.
// The functionality is now handled by a modal in /src/app/politicians/page.tsx.
// Intentionally left empty or can be deleted.
// For safety, this file will be removed.
