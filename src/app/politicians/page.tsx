// src/app/politicians/page.tsx
import React from 'react';
import Link from 'next/link'; 
import PoliticianCard, { PoliticianSummary } from '@/components/politicians/PoliticianCard';
import { createSupabaseServerClient } from '@/lib/supabase/server'; 
import { getPublicUrlForMediaAsset } from '@/lib/supabase/storage.server.ts'; 
import { User, Search, Filter as FilterIcon, LayoutGrid, List } from 'lucide-react'; 
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import PaginationControls from '@/components/ui/PaginationControls'; // Import PaginationControls

interface RawPoliticianData {
  id: string | number; 
  name: string;
  name_nepali?: string | null;
  photo_asset_id?: string | null;
  current_party_name?: string | null;
  current_position_title?: string | null;
  has_criminal_record?: boolean | null; 
  created_at?: string; 
  status?: string; 
  gender?: string; 
  province?: string; 
}

async function fetchPoliticiansList(
  options: { 
    searchQuery?: string; 
    page?: number;
    gender?: string;
    hasCriminalRecord?: boolean;
    party?: string;
    province?: string;
  } = {}
): Promise<{ politicians: PoliticianSummary[]; count: number | null }> {
  const supabase = createSupabaseServerClient();
  const { searchQuery, page = 1, gender, hasCriminalRecord, party, province } = options;
  const itemsPerPage = 20; 
  const offset = (page - 1) * itemsPerPage;

  let queryBuilder = supabase
    .from('politicians')
    .select(\`
      id,
      name,
      name_nepali,
      photo_asset_id,
      current_party_name, 
      current_position_title,
      has_criminal_record,
      created_at,
      gender,
      province 
    \`, { count: 'exact' }) 
    .eq('status', 'Approved');

  if (gender) {
    queryBuilder = queryBuilder.eq('gender', gender);
  }
  if (hasCriminalRecord) { 
    queryBuilder = queryBuilder.eq('has_criminal_record', true);
  }
  if (party) {
    queryBuilder = queryBuilder.eq('current_party_name', party); 
  }
  if (province) {
    queryBuilder = queryBuilder.eq('province', province); 
  }

  if (searchQuery) {
    const searchTerm = `%${searchQuery}%`;
    queryBuilder = queryBuilder.or(
      \`name.ilike.${searchTerm},name_nepali.ilike.${searchTerm}\`
    );
  }
  
  queryBuilder = queryBuilder
    .order('created_at', { ascending: false })
    .range(offset, offset + itemsPerPage - 1)
    .limit(itemsPerPage);

  const { data, error, count } = await queryBuilder;

  if (error) {
    console.error('Error fetching politicians:', error.message);
    return { politicians: [], count: 0 };
  }
  if (!data) {
    return { politicians: [], count: 0 };
  }

  const politiciansWithPhotoUrls: PoliticianSummary[] = await Promise.all(
    data.map(async (politician: RawPoliticianData) => {
      let photoUrl: string | null = null;
      if (politician.photo_asset_id) {
        photoUrl = await getPublicUrlForMediaAsset(politician.photo_asset_id);
      }
      return {
        id: String(politician.id), 
        name: politician.name,
        name_nepali: politician.name_nepali,
        photo_url: photoUrl,
        current_party_name: politician.current_party_name,
        current_position_title: politician.current_position_title,
        has_criminal_record: politician.has_criminal_record,
      };
    })
  );
  return { politicians: politiciansWithPhotoUrls, count };
}

export default async function PoliticiansPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    page?: string;
    gender?: string;
    has_criminal_record?: string; 
    party?: string;
    province?: string;
    view?: 'grid' | 'list'; // Added view parameter
  };
}) {
  const searchQuery = searchParams?.q || '';
  const currentPage = Number(searchParams?.page) || 1;
  const genderFilter = searchParams?.gender || '';
  const hasCriminalRecordFilter = searchParams?.has_criminal_record === 'true';
  const partyFilter = searchParams?.party || '';
  const provinceFilter = searchParams?.province || '';
  const viewMode = searchParams?.view || 'grid'; // Default to grid view

  const { politicians, count } = await fetchPoliticiansList({ 
    searchQuery, 
    page: currentPage,
    gender: genderFilter,
    hasCriminalRecord: hasCriminalRecordFilter,
    party: partyFilter,
    province: provinceFilter,
  });

  const itemsPerPage = 20; // Consistent with fetchPoliticiansList
  const totalPages = count !== null ? Math.ceil(count / itemsPerPage) : 0;

  // Helper to build links preserving all current search/filter params
  const buildLinkWithParams = (newParams: Record<string, string>) => {
    const params = new URLSearchParams();
    if (searchParams?.q) params.set('q', searchParams.q);
    if (searchParams?.gender) params.set('gender', searchParams.gender);
    if (searchParams?.party) params.set('party', searchParams.party);
    if (searchParams?.province) params.set('province', searchParams.province);
    if (searchParams?.has_criminal_record) params.set('has_criminal_record', searchParams.has_criminal_record);
    // For view links, page should be preserved or reset to 1 - let's preserve
    if (searchParams?.page) params.set('page', searchParams.page); 
    // For pagination links, view should be preserved
    if (searchParams?.view) params.set('view', searchParams.view);


    // Override with new params
    for (const [key, value] of Object.entries(newParams)) {
      if (value) { // only set if value is provided
        params.set(key, value);
      } else {
        params.delete(key); // remove if new value is empty (e.g. clearing a filter)
      }
    }
    const queryString = params.toString();
    return `/politicians${queryString ? `?${queryString}` : ''}`;
  };
  
  // Specifically for view toggle links
  const createViewLink = (newViewMode: 'grid' | 'list') => {
    return buildLinkWithParams({ view: newViewMode });
  }

  // For PaginationControls, prepare searchParams excluding 'page'
  const paramsForPagination = new URLSearchParams();
  if (searchParams?.q) paramsForPagination.set('q', searchParams.q);
  if (searchParams?.gender) paramsForPagination.set('gender', searchParams.gender);
  if (searchParams?.party) paramsForPagination.set('party', searchParams.party);
  if (searchParams?.province) paramsForPagination.set('province', searchParams.province);
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

      {/* Filters and Search Form */}
      <div className="mb-6 md:mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-sm">
        <form action="/politicians" method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          
          <div className="lg:col-span-2">
            <Label htmlFor="search-q" className="text-sm font-medium">Search by Name</Label>
            <Input
              type="search"
              id="search-q"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search (Eng/Nep)..."
              className="w-full bg-white dark:bg-gray-800 mt-1"
            />
          </div>

          <div>
            <Label htmlFor="gender-filter" className="text-sm font-medium">Gender</Label>
            <Select name="gender" defaultValue={genderFilter}>
              <SelectTrigger id="gender-filter" className="w-full bg-white dark:bg-gray-800 mt-1">
                <SelectValue placeholder="Any Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Gender</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="party-filter" className="text-sm font-medium">Party</Label>
            <Select name="party" defaultValue={partyFilter}>
              <SelectTrigger id="party-filter" className="w-full bg-white dark:bg-gray-800 mt-1">
                <SelectValue placeholder="Any Party" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Party</SelectItem>
                <SelectItem value="party_placeholder_1">Placeholder Party A</SelectItem>
                {/* TODO: Populate dynamically */}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="province-filter" className="text-sm font-medium">Province</Label>
            <Select name="province" defaultValue={provinceFilter}>
              <SelectTrigger id="province-filter" className="w-full bg-white dark:bg-gray-800 mt-1">
                <SelectValue placeholder="Any Province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Province</SelectItem>
                <SelectItem value="province_placeholder_1">Placeholder Province 1</SelectItem>
                {/* TODO: Populate dynamically */}
              </SelectContent>
            </Select>
          </div>
          
          {/* Checkbox and Apply button might need their own column or careful spanning */}
          <div className="flex items-end space-x-2 lg:col-span-1"> {/* Grouping checkbox and button */}
            <div className="flex items-center space-x-2 flex-grow sm:flex-grow-0 py-2"> {/* Checkbox part */}
              <Checkbox id="has_criminal_record-filter" name="has_criminal_record" value="true" defaultChecked={hasCriminalRecordFilter} />
              <Label htmlFor="has_criminal_record-filter" className="text-sm font-medium whitespace-nowrap">
                Has Criminal Record
              </Label>
            </div>
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              <FilterIcon className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Apply</span>
            </Button>
          </div>
        </form>
        
        {/* View Toggle Buttons */}
        <div className="flex items-center justify-end gap-2 mt-4">
            <span className="text-sm text-muted-foreground">View as:</span>
            <Link href={createViewLink('grid')} passHref legacyBehavior>
                <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" title="Grid View" asChild>
                <a><LayoutGrid className="h-5 w-5" /></a>
                </Button>
            </Link>
            <Link href={createViewLink('list')} passHref legacyBehavior>
                <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" title="List View" asChild>
                <a><List className="h-5 w-5" /></a>
                </Button>
            </Link>
        </div>
      </div>
      
      {(searchQuery || genderFilter || partyFilter || provinceFilter || hasCriminalRecordFilter) && count !== null && (
        <div className="mb-4 text-sm text-muted-foreground">
          Found {count} politician(s) matching your criteria.
          {(searchQuery) && <span> Searched for: "{searchQuery}".</span>}
        </div>
      )}

      {politicians.length > 0 ? (
        <div className={
          viewMode === 'list' 
          ? "flex flex-col space-y-4" // Reduced space for list view
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
        }>
          {politicians.map((politician) => (
            <div key={politician.id} className={viewMode === 'list' ? 'w-full max-w-3xl mx-auto' : ''}>
               <PoliticianCard politician={politician} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 md:py-16">
          <User className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No Politicians Found</h3>
          <p className="text-muted-foreground mt-2">
            No politician profiles match your current filters. Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {count !== null && totalPages > 1 && (
         <PaginationControls
           currentPage={currentPage}
           totalCount={count}
           itemsPerPage={itemsPerPage}
           basePath="/politicians"
           currentSearchParams={paramsForPagination} // Use the specifically prepared params
         />
      )}
    </div>
  );
}
