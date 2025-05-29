
"use client";
import type { PoliticianPartyMembership } from '@/types/entities';
import Image from 'next/image';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Landmark } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PartyAffiliationProps {
  partyMemberships?: PoliticianPartyMembership[];
}

function getStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const supabase = createSupabaseBrowserClient(); 
  const { data } = supabase.storage.from('media_assets').getPublicUrl(path); 
  return data?.publicUrl || null;
}

export default function PartyAffiliation({ partyMemberships }: PartyAffiliationProps) {
  const activeMembership = partyMemberships?.find(pm => pm.is_active);
  const [partyLogoUrl, setPartyLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (activeMembership?.parties?.logo?.storage_path) {
      setPartyLogoUrl(getStorageUrl(activeMembership.parties.logo.storage_path));
    }
  }, [activeMembership]);

  if (!activeMembership || !activeMembership.parties) {
    return <p className="text-sm text-muted-foreground">No active party affiliation listed or independent.</p>;
  }

  const party = activeMembership.parties;

  return (
    <div className="flex items-center gap-3">
      {partyLogoUrl ? (
        <Image 
            src={partyLogoUrl} 
            alt={`${party.name} logo`} 
            width={40} 
            height={40} 
            className="rounded-sm object-contain"
            data-ai-hint="party logo small"
        />
      ) : (
        <Landmark className="w-8 h-8 text-muted-foreground" />
      )}
      <div>
        <Link href={`/parties/${party.id}`} className="text-md font-semibold text-foreground hover:text-primary hover:underline">
          {party.name} {party.abbreviation && `(${party.abbreviation})`}
        </Link>
        {activeMembership.role_in_party && (
            <p className="text-xs text-muted-foreground">{activeMembership.role_in_party}</p>
        )}
        {activeMembership.start_date && (
            <p className="text-xs text-muted-foreground">
                Joined: {new Date(activeMembership.start_date).toLocaleDateString()}
            </p>
        )}
      </div>
    </div>
  );
}
