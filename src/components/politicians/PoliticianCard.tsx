
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { PoliticianCardData } from '@/types/entities';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, ShieldCheck, ArrowUp, ArrowDown } from 'lucide-react'; 
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context'; 
import { useToast } from '@/hooks/use-toast'; 
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PoliticianCardProps {
  politician: PoliticianCardData;
}

function getStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const supabase = createSupabaseBrowserClient();
  const { data } = supabase.storage.from('media_assets').getPublicUrl(path); 
  return data?.publicUrl || null;
}


export function PoliticianCard({ politician }: PoliticianCardProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const supabase = createSupabaseBrowserClient();

  const [isFollowed, setIsFollowed] = useState(politician.is_followed_by_user || false);
  const [currentVoteScore, setCurrentVoteScore] = useState(politician.vote_score || 0);
  const [userVoteStatus, setUserVoteStatus] = useState<'up' | 'down' | null>(null); // 'up', 'down', or null

  const currentPartyMembership = politician.party_memberships?.find(pm => pm.is_active);
  const currentParty = currentPartyMembership?.parties;

  const currentPositionInfo = politician.politician_positions?.find(pp => pp.is_current);
  const currentPosition = currentPositionInfo?.position_titles;

  const placeholderImage = "https://placehold.co/600x400.png";
  const imageUrl = politician.media_assets?.storage_path 
                   ? getStorageUrl(politician.media_assets.storage_path) 
                   : placeholderImage;

  const partyLogoUrl = currentParty?.media_assets?.storage_path 
                      ? getStorageUrl(currentParty.media_assets.storage_path)
                      : null;

  // Fetch user's current vote for this politician on mount
  useEffect(() => {
    const fetchUserVote = async () => {
      if (isAuthenticated && user) {
        const { data, error } = await supabase
          .from('politician_votes')
          .select('vote_type')
          .eq('politician_id', politician.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user vote", error);
        } else if (data) {
          setUserVoteStatus(data.vote_type === 1 ? 'up' : 'down');
        }
      }
    };
    fetchUserVote();
  }, [isAuthenticated, user, politician.id, supabase]);


  const handleFollow = async () => {
    // Placeholder
    setIsFollowed(!isFollowed);
    toast({ title: isFollowed ? `Unfollowed ${politician.name}` : `Following ${politician.name}` });
  };
  
  const handleVote = async (newVoteType: 'up' | 'down') => {
    if (!isAuthenticated || !user) {
      toast({ title: "Please log in to vote.", variant: "destructive" });
      return;
    }

    let newOptimisticScore = currentVoteScore;
    let dbVoteValue: 1 | -1 = newVoteType === 'up' ? 1 : -1;

    if (userVoteStatus === newVoteType) { // Clicking the same button again (undo vote)
      // User is undoing their vote
      newOptimisticScore += (newVoteType === 'up' ? -1 : 1);
      setUserVoteStatus(null);
      // Delete the vote from DB
      const { error } = await supabase
        .from('politician_votes')
        .delete()
        .match({ politician_id: politician.id, user_id: user.id });
      if (error) {
        toast({ title: "Error undoing vote", description: error.message, variant: "destructive" });
        // Revert optimistic update
        setUserVoteStatus(newVoteType);
        // score will be refetched or re-calculated if needed, or revert optimistic score change here
      } else {
        toast({ title: "Vote removed" });
      }
    } else { // New vote or changing vote
      if (userVoteStatus === 'up') newOptimisticScore -= 1; // Was upvoted
      if (userVoteStatus === 'down') newOptimisticScore += 1; // Was downvoted
      
      newOptimisticScore += (newVoteType === 'up' ? 1 : -1);
      setUserVoteStatus(newVoteType);

      // Upsert the vote (insert or update if exists)
      const { error } = await supabase
        .from('politician_votes')
        .upsert(
          { politician_id: politician.id, user_id: user.id, vote_type: dbVoteValue, updated_at: new Date().toISOString() },
          { onConflict: 'politician_id, user_id' } 
        );
      if (error) {
        toast({ title: "Error casting vote", description: error.message, variant: "destructive" });
        // Revert optimistic update (simplified: refetch or more complex state management needed for perfect revert)
        setUserVoteStatus(userVoteStatus); // Revert to previous
      } else {
        toast({ title: `Voted ${newVoteType}!`});
      }
    }
    setCurrentVoteScore(newOptimisticScore); // Update score shown immediately
  };

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) {
    return (
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="animate-pulse">
            <div className="h-48 w-full bg-muted" />
            <CardHeader>
            <div className="h-6 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/2 mt-2 rounded bg-muted" />
            </CardHeader>
            <CardContent>
            <div className="h-4 w-full rounded bg-muted mb-2" />
            <div className="h-4 w-5/6 rounded bg-muted" />
            </CardContent>
            <CardFooter className="justify-between">
            <div className="h-8 w-20 rounded bg-muted" />
            <div className="h-8 w-8 rounded-full bg-muted" />
            </CardFooter>
        </div>
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
         <div className="flex items-center space-x-2 text-sm">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote('up')}
                className={cn("p-1 h-auto", userVoteStatus === 'up' && "text-primary bg-primary/10")}
                aria-pressed={userVoteStatus === 'up'}
                disabled={!isAuthenticated}
            >
                <ArrowUp className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-[20px] text-center">{currentVoteScore}</span>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote('down')}
                className={cn("p-1 h-auto", userVoteStatus === 'down' && "text-destructive bg-destructive/10")}
                aria-pressed={userVoteStatus === 'down'}
                disabled={!isAuthenticated}
            >
                <ArrowDown className="h-4 w-4" />
            </Button>
        </div>
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
