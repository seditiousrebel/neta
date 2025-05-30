// src/app/politicians/page.tsx
"use client";

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import type { PartyFilterOption, ProvinceFilterOption, PoliticianSummary } from '@/types/entities';
import PoliticianFilters from '@/components/politicians/PoliticianFilters';
import PoliticianList from '@/components/politicians/PoliticianList';
import PaginationControls from '@/components/ui/PaginationControls';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import PoliticianForm, { type PoliticianFormData } from '@/components/contribute/PoliticianForm';
import { submitNewPoliticianContribution } from '@/lib/supabase/contributions';
import { useAuth } from '@/contexts/auth-context';
import { getPartyFilterOptions, getProvinceFilterOptions } from '@/lib/supabase/data';
import { usePoliticians } from '@/hooks/usePoliticians'; // Import the hook

const ITEMS_PER_PAGE = 12;

// No longer needs initialPoliticians or initialTotalCount as props
interface PoliticiansPageProps {}

export default function PoliticiansPageClient({}: PoliticiansPageProps) {
  const router = useRouter();
  const currentSearchParamsHook = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [partyOptions, setPartyOptions] = useState<PartyFilterOption[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<ProvinceFilterOption[]>([]);
  const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(true);

  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [formDataForPreview, setFormDataForPreview] = useState<PoliticianFormData | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFilterOptions() {
      setIsLoadingFilterOptions(true);
      try {
        const [parties, provinces] = await Promise.all([
          getPartyFilterOptions(),
          getProvinceFilterOptions()
        ]);
        setPartyOptions(parties);
        setProvinceOptions(provinces);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      } finally {
        setIsLoadingFilterOptions(false);
      }
    }
    fetchFilterOptions();
  }, []);

  const currentSearchParams = {
    q: currentSearchParamsHook.get('q') || undefined,
    page: currentSearchParamsHook.get('page') || undefined,
    partyId: currentSearchParamsHook.get('partyId') || undefined,
    provinceId: currentSearchParamsHook.get('provinceId') || undefined,
    has_criminal_record: currentSearchParamsHook.get('has_criminal_record') || 'any',
    view: (currentSearchParamsHook.get('view') as 'grid' | 'list' | undefined) || undefined,
  };

  const currentPage = Number(currentSearchParams?.page) || 1;

  const {
    data: politicianHookData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingPoliticians,
    isError: isPoliticiansError,
    error: politiciansError,
  } = usePoliticians(
    { 
      searchTerm: currentSearchParams.q,
      partyId: currentSearchParams.partyId,
      provinceId: currentSearchParams.provinceId,
      hasCriminalRecord: currentSearchParams.has_criminal_record
    }
    // No initialData passed here; the hook fetches everything
  );

  const allPoliticians = politicianHookData?.pages.flatMap(page => page.data) || [];
  const currentTotalCount = politicianHookData?.pages[0]?.totalCount ?? 0;
  const totalPages = Math.ceil(currentTotalCount / ITEMS_PER_PAGE);

  const paramsForPagination = new URLSearchParams();
  if (currentSearchParams?.q) paramsForPagination.set('q', currentSearchParams.q);
  if (currentSearchParams?.partyId) paramsForPagination.set('partyId', currentSearchParams.partyId);
  if (currentSearchParams?.provinceId) paramsForPagination.set('provinceId', currentSearchParams.provinceId);
  if (currentSearchParams?.has_criminal_record) paramsForPagination.set('has_criminal_record', currentSearchParams.has_criminal_record);
  if (currentSearchParams?.view) paramsForPagination.set('view', currentSearchParams.view);

  const isTrulyEmptyDatabase =
    !currentSearchParams?.q &&
    !currentSearchParams?.partyId &&
    !currentSearchParams?.provinceId &&
    (!currentSearchParams?.has_criminal_record || currentSearchParams?.has_criminal_record === 'any') &&
    !isLoadingPoliticians && // Check against the hook's loading state
    currentTotalCount === 0; // Check against the hook's fetched total count

  const handleOpenContributeModal = () => {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', window.location.origin);
      loginUrl.searchParams.set('next', '/politicians');
      router.push(loginUrl.toString());
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
      // TODO: Consider revalidating or refetching the politicians list here if using TanStack Query
      // router.refresh(); // Or use TanStack Query's invalidateQueries
    } catch (err: any) {
      setSubmissionStatus('error');
      setSubmissionMessage(err.message || "An unexpected error occurred.");
    }
  };
  
  const resetContributionModal = () => {
    setIsContributeModalOpen(false);
    setTimeout(() => {
        setIsPreviewing(false);
        setFormDataForPreview(null);
        setSubmissionStatus('idle');
        setSubmissionMessage(null);
    }, 300);
  };

  const showLoadingSkeletons = isLoadingPoliticians && allPoliticians.length === 0;

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
        <PoliticianFilters parties={partyOptions} provinces={provinceOptions} isLoadingOptions={isLoadingFilterOptions} />
      </Suspense>
      
      {showLoadingSkeletons ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-8">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
            <Skeleton key={index} className="h-[350px] w-full rounded-lg" />
          ))}
        </div>
      ) : isPoliticiansError ? (
        <p className="text-destructive text-center py-8">Error loading politicians: {politiciansError?.message}</p>
      ) : isTrulyEmptyDatabase && !isLoadingFilterOptions ? (
        <div className="text-center text-muted-foreground py-12">
          <p className="text-xl mb-2">No Politicians Found in the Database</p>
          <p className="mb-4">It looks like there are no politicians listed yet. Be the first to add one!</p>
        </div>
      ) : (
        <>
          <PoliticianList 
            politicians={allPoliticians} 
            isLoading={isLoadingPoliticians && allPoliticians.length > 0} // Pass true if loading more but some already shown
            isError={isPoliticiansError}
            error={politiciansError}
            totalCount={currentTotalCount}
          />
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
          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalCount={currentTotalCount}
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
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ); 
}
