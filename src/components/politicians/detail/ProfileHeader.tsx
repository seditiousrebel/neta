
"use client";

import type { DetailedPolitician } from '@/types/entities';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Heart, UserCircle, CalendarDays, MapPin } from 'lucide-react'; // Added more icons
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

interface ProfileHeaderProps {
  politician: DetailedPolitician;
}

function getStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // This function should ideally not create a new client on every call
  // For simplicity here, but in a larger app, pass client or use a singleton.
  const supabase = createSupabaseBrowserClient(); 
  const { data } = supabase.storage.from('media_assets').getPublicUrl(path); 
  return data?.publicUrl || null;
}

export default function ProfileHeader({ politician }: ProfileHeaderProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (politician.media_assets?.storage_path) {
      setImageUrl(getStorageUrl(politician.media_assets.storage_path));
    } else {
      setImageUrl("https://placehold.co/400x400.png");
    }
  }, [politician.media_assets?.storage_path]);
  
  if (!isMounted) {
    return (
      <div className="animate-pulse flex flex-col md:flex-row items-center md:items-start gap-6 p-4 md:p-6 bg-card border rounded-lg shadow-md">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-muted shrink-0"></div>
        <div className="flex-grow space-y-3">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-5 bg-muted rounded w-1/2"></div>
          <div className="h-5 bg-muted rounded w-1/3"></div>
          <div className="h-10 bg-muted rounded w-24 mt-2"></div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-4 md:p-6 bg-card border rounded-lg shadow-md">
      <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shrink-0 border-4 border-primary/20">
        {imageUrl ? (
            <Image
            src={imageUrl}
            alt={politician.name || 'Politician photo'}
            layout="fill"
            objectFit="cover"
            className="rounded-full"
            data-ai-hint="politician portrait"
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted rounded-full">
                <UserCircle className="w-20 h-20 text-muted-foreground" />
            </div>
        )}
      </div>
      <div className="flex-grow text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">{politician.name}</h1>
        {politician.name_nepali && <p className="text-xl text-muted-foreground">{politician.name_nepali}</p>}
        
        <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-2 items-center text-sm text-muted-foreground">
            {politician.dob && (
                <span className="flex items-center"><CalendarDays className="w-4 h-4 mr-1.5" /> Born: {new Date(politician.dob).toLocaleDateString()}</span>
            )}
            {politician.gender && (
                <span className="flex items-center"><UserCircle className="w-4 h-4 mr-1.5" /> Gender: {politician.gender}</span>
            )}
        </div>
        {politician.permanent_address && (
             <p className="mt-1 text-sm text-muted-foreground flex items-center justify-center md:justify-start">
                <MapPin className="w-4 h-4 mr-1.5 shrink-0" /> {politician.permanent_address}
            </p>
        )}


        {politician.is_independent && (
            <Badge variant="secondary" className="mt-2">Independent</Badge>
        )}
        
        <div className="mt-4">
          <Button size="sm" variant="outline">
            <Heart className="mr-2 h-4 w-4" /> Follow
          </Button>
          {/* Add other actions like "Suggest Edit" here */}
        </div>
      </div>
    </div>
  );
}
