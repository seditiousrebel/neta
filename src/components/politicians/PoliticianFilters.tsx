
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search as SearchIcon, X, Landmark, FileWarning } from 'lucide-react'; // Added Landmark, FileWarning
import type { PartyFilterOption, ProvinceFilterOption } from '@/types/entities';

interface PoliticianFiltersProps {
  initialParties: PartyFilterOption[];
  initialProvinces: ProvinceFilterOption[];
}

// Basic debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}


export default function PoliticianFilters({ initialParties, initialProvinces }: PoliticianFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedParty, setSelectedParty] = useState(searchParams.get('partyId') || '');
  const [selectedProvince, setSelectedProvince] = useState(searchParams.get('provinceId') || '');
  const [selectedCriminalRecord, setSelectedCriminalRecord] = useState(searchParams.get('hasCriminalRecord') || 'any');

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | null>) => {
      const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
      
      Object.entries(paramsToUpdate).forEach(([name, value]) => {
        if (value && value !== 'any') { // "any" means no filter for criminal record
          currentParams.set(name, value);
        } else {
          currentParams.delete(name);
        }
      });
      
      currentParams.set('page', '1'); // Reset page to 1 whenever filters change
      return currentParams.toString();
    },
    [searchParams]
  );

  const updateUrlParams = (paramsToUpdate: Record<string, string | null>) => {
    router.push(`${pathname}?${createQueryString(paramsToUpdate)}`, { scroll: false });
  };
  
  const debouncedSearchUpdate = useCallback(debounce((term: string) => {
    updateUrlParams({ search: term || null });
  }, 500), [pathname, createQueryString]);


  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setSelectedParty(searchParams.get('partyId') || '');
    setSelectedProvince(searchParams.get('provinceId') || '');
    setSelectedCriminalRecord(searchParams.get('hasCriminalRecord') || 'any');
  }, [searchParams]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    debouncedSearchUpdate(newSearchTerm);
  };

  const handlePartyChange = (partyId: string) => {
    setSelectedParty(partyId);
    updateUrlParams({ partyId: partyId === 'all' ? null : partyId });
  };

  const handleProvinceChange = (provinceId: string) => {
    setSelectedProvince(provinceId);
    updateUrlParams({ provinceId: provinceId === 'all' ? null : provinceId });
  };
  
  const handleCriminalRecordChange = (value: string) => {
    setSelectedCriminalRecord(value);
    updateUrlParams({ hasCriminalRecord: value === 'any' ? null : value });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedParty('');
    setSelectedProvince('');
    setSelectedCriminalRecord('any');
    router.push(pathname, { scroll: false }); 
  };
  
  const hasActiveFilters = !!searchTerm || !!selectedParty || !!selectedProvince || selectedCriminalRecord !== 'any';

  return (
    <div className="space-y-6 p-4 md:p-6 bg-card border rounded-lg shadow">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 items-end"> {/* Adjusted to 4 columns for new filter */}
        <div className="space-y-1.5">
          <Label htmlFor="search-politicians">Search by Name/Keyword</Label>
          <div className="relative">
            <Input
              id="search-politicians"
              type="search"
              placeholder="e.g. John Doe, climate..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pr-10"
            />
            <SearchIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="party-filter">Filter by Party</Label>
          <Select value={selectedParty} onValueChange={handlePartyChange}>
            <SelectTrigger id="party-filter">
              <SelectValue placeholder="All Parties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parties</SelectItem>
              {initialParties.map((party) => (
                <SelectItem key={party.id} value={String(party.id)}>
                  {party.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="province-filter">Filter by Province</Label>
          <Select value={selectedProvince} onValueChange={handleProvinceChange}>
            <SelectTrigger id="province-filter">
                <Landmark className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Provinces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Provinces</SelectItem>
              {initialProvinces.map((province) => (
                <SelectItem key={province.id} value={String(province.id)}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="criminal-record-filter">Criminal Record?</Label>
          <Select value={selectedCriminalRecord} onValueChange={handleCriminalRecordChange}>
            <SelectTrigger id="criminal-record-filter">
                <FileWarning className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {hasActiveFilters && (
        <Button onClick={clearFilters} variant="outline" size="sm" className="mt-4">
          <X className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>
      )}
    </div>
  );
}
