
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { PoliticianCardData } from '@/types/entities';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Award, MessageSquare, TrendingUp, ShieldCheck } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context'; // For follow button
import { useToast } from '@/hooks/use-toast'; // For follow button
import { useState, useEffect } from 'react';

interface PoliticianCardProps {
  politician: PoliticianCardData;
}

// Helper to get public URL for Supabase storage items
function getStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const supabase = createSupabaseBrowserClient();
  const { data } = supabase.storage.from('media_assets').getPublicUrl(path); // Assuming 'media_assets' bucket
  return data?.publicUrl || null;
}


export function PoliticianCard({ politician }: PoliticianCardProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [isFollowed, setIsFollowed] = useState(politician.is_followed_by_user || false); // Placeholder
  
  // Find current party
  const currentPartyMembership = politician.party_memberships?.find(pm => pm.is_active);
  const currentParty = currentPartyMembership?.parties;

  // Find current position
  const currentPositionInfo = politician.politician_positions?.find(pp => pp.is_current);
  const currentPosition = currentPositionInfo?.position_titles;

  // Get vote score
  const rating = politician.politician_ratings?.[0]; // Assuming first rating is the relevant one
  const voteScore = rating?.vote_score;

  const placeholderImage = "https://placehold.co/600x400.png";
  const imageUrl = politician.media_assets?.storage_path 
                   ? getStorageUrl(politician.media_assets.storage_path) 
                   : placeholderImage;

  const partyLogoUrl = currentParty?.media_assets?.storage_path 
                      ? getStorageUrl(currentParty.media_assets.storage_path)
                      : null;

  const handleFollow = async () => {
    if (!isAuthenticated || !user) {
      toast({ title: "Please log in to follow politicians.", variant: "destructive" });
      return;
    }
    // Placeholder: Implement actual follow/unfollow logic with Supabase
    // const supabase = createSupabaseBrowserClient();
    // if (isFollowed) {
    //   // await supabase.from('follows').delete().match({ user_id: user.id, entity_id: politician.id, entity_type: 'Politician' });
    // } else {
    //   // await supabase.from('follows').insert({ user_id: user.id, entity_id: politician.id, entity_type: 'Politician' });
    // }
    setIsFollowed(!isFollowed);
    toast({ title: isFollowed ? `Unfollowed ${politician.name}` : `Following ${politician.name}` });
  };
  
  // Client-side effect to avoid hydration mismatch for potentially random elements or initial states
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) {
    return (
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <Skeleton className="h-48 w-full" />
        <CardHeader>
          <Skeleton className="h-6 w-3/4 rounded" />
          <Skeleton className="h-4 w-1/2 mt-2 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full rounded mb-2" />
          <Skeleton className="h-4 w-5/6 rounded" />
        </CardContent>
        <CardFooter className="justify-between">
           <Skeleton className="h-8 w-20 rounded" />
           <Skeleton className="h-8 w-8 rounded-full" />
        </CardFooter>
      </Card>
    );
  }


  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <Link href={`/politicians/${politician.id}`} className="block">
        <div className="relative h-48 w-full bg-muted">
          <Image
            src={imageUrl || placeholderImage}
            alt={politician.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint="politician portrait"
          />
        </div>
      </Link>
      <CardHeader className="pb-3">
        <Link href={`/politicians/${politician.id}`}>
          <CardTitle className="text-xl font-semibold hover:text-primary transition-colors">
            {politician.name}
          </CardTitle>
        </Link>
        {currentPosition && (
          <p className="text-sm text-primary flex items-center">
            <ShieldCheck size={16} className="mr-1.5" />
            {currentPosition.title}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        {currentParty && (
          <div className="mb-3 flex items-center text-sm text-muted-foreground">
            {partyLogoUrl ? (
              <Image src={partyLogoUrl} alt={`${currentParty.name} logo`} width={20} height={20} className="mr-2 rounded-sm object-contain" data-ai-hint="party logo" />
            ) : (
              <Users size={16} className="mr-2" />
            )}
            {currentParty.name} {currentParty.abbreviation && `(${currentParty.abbreviation})`}
          </div>
        )}
        <p className="text-sm text-foreground/80 line-clamp-3 mb-3">
          {politician.bio || "No biography available."}
        </p>
        {voteScore !== undefined && voteScore !== null && (
          <div className="flex items-center text-sm">
            <TrendingUp size={16} className="mr-1.5 text-green-500" />
            Vote Score: <span className="font-semibold ml-1">{voteScore}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4 mt-auto">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/politicians/${politician.id}`}>
            View Profile
          </Link>
        </Button>
        {isAuthenticated && (
          <Button variant="ghost" size="icon" onClick={handleFollow} title={isFollowed ? "Unfollow" : "Follow"}>
            <Heart className={`h-5 w-5 ${isFollowed ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
