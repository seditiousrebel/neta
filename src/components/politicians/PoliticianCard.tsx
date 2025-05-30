
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, ShieldAlert, Briefcase, Users, Share2, Heart, ArrowUp, ArrowDown, FileWarning, Loader2 } from 'lucide-react';
import type { PoliticianSummary } from '@/types/entities';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { followEntityAction, unfollowEntityAction } from '@/lib/actions/follow.actions';
import { checkIfUserFollowsEntity } from '@/lib/supabase/data'; // Client-side check for initial status

interface PoliticianCardProps {
  politician: PoliticianSummary;
}

const PoliticianCard: React.FC<PoliticianCardProps> = ({ politician }) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [isFollowed, setIsFollowed] = useState(false);
  const [isLoadingFollowStatus, setIsLoadingFollowStatus] = useState(true);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(politician.photo_url || '/placeholder-person.png');
  const [currentVoteScore, setCurrentVoteScore] = useState(politician.vote_score || 0);
  const [userVoteStatus, setUserVoteStatus] = useState<'up' | 'down' | null>(null);
  const [isLoadingVoteStatus, setIsLoadingVoteStatus] = useState(true);

  // Fetch initial follow status
  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (isAuthenticated && user && politician.id) {
        setIsLoadingFollowStatus(true);
        try {
          const follows = await checkIfUserFollowsEntity(user.id, Number(politician.id), 'Politician');
          setIsFollowed(follows);
        } catch (error) {
          console.error("Error fetching follow status:", error);
        } finally {
          setIsLoadingFollowStatus(false);
        }
      } else {
        setIsLoadingFollowStatus(false);
        setIsFollowed(false);
      }
    };
    fetchFollowStatus();
  }, [isAuthenticated, user, politician.id]);
  
  // Fetch initial vote status (Placeholder - full implementation in a later step)
  useEffect(() => {
    const fetchVoteStatus = async () => {
      if (isAuthenticated && user && politician.id) {
        setIsLoadingVoteStatus(true);
        // TODO: Implement actual check if user has voted for this politician
        // For now, assume no prior vote
        // const vote = await checkIfUserVotedForPolitician(user.id, Number(politician.id));
        // setUserVoteStatus(vote ? vote.vote_type > 0 ? 'up' : 'down' : null);
        setIsLoadingVoteStatus(false);
      } else {
        setIsLoadingVoteStatus(false);
        setUserVoteStatus(null);
      }
    };
    fetchVoteStatus();
  }, [isAuthenticated, user, politician.id]);


  useEffect(() => {
    setCurrentPhotoUrl(politician.photo_url || '/placeholder-person.png');
    setCurrentVoteScore(politician.vote_score || 0);
  }, [politician.photo_url, politician.vote_score]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated || !user) {
      toast({ title: "Login Required", description: "Please log in to follow politicians.", variant: "info" });
      return;
    }
    if (!politician.id) return;

    const newFollowState = !isFollowed;
    setIsFollowed(newFollowState); // Optimistic update

    startTransition(async () => {
      const action = newFollowState ? followEntityAction : unfollowEntityAction;
      const result = await action(Number(politician.id), 'Politician');
      if (!result.success) {
        setIsFollowed(!newFollowState); // Revert on error
        toast({ title: "Error", description: result.error || "Could not update follow status.", variant: "destructive" });
      } else {
        toast({ title: newFollowState ? "Followed!" : "Unfollowed", description: `You are now ${newFollowState ? 'following' : 'no longer following'} ${politician.name}.` });
      }
    });
  };
  
  const handleVote = async (voteType: 'up' | 'down') => {
    if (!isAuthenticated || !user) {
        toast({ title: "Login Required", description: "Please log in to vote.", variant: "info" });
        return;
    }
    if (!politician.id) return;

    // Placeholder for voting logic
    // This will be expanded with server actions in a future step
    let optimisticVoteScore = currentVoteScore;
    let optimisticUserVoteStatus = userVoteStatus;

    if (userVoteStatus === voteType) { // Undoing vote
      optimisticVoteScore += (voteType === 'up' ? -1 : 1);
      optimisticUserVoteStatus = null;
    } else {
      if (userVoteStatus === 'up') optimisticVoteScore--;
      if (userVoteStatus === 'down') optimisticVoteScore++;
      optimisticVoteScore += (voteType === 'up' ? 1 : -1);
      optimisticUserVoteStatus = voteType;
    }
    
    setCurrentVoteScore(optimisticVoteScore);
    setUserVoteStatus(optimisticUserVoteStatus);
    toast({ title: "Vote (Placeholder)", description: `Vote recorded for ${politician.name}. Full logic pending.` });
    // TODO: Implement server action to record vote
  };


  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/politicians/${politician.id}`;
    const shareTitle = politician.name;
    const shareText = `Check out ${politician.name} on Netrika`;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch (error) {
        console.error('Error sharing:', error);
        navigator.clipboard.writeText(shareUrl).then(() => alert('Profile link copied to clipboard!'));
      }
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => alert('Profile link copied to clipboard!'));
    }
  };

  return (
    <Card className="w-full max-w-sm rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out flex flex-col bg-card text-card-foreground">
      <Link href={`/politicians/${politician.id}`} passHref legacyBehavior>
        <a className="block group">
          <CardHeader className="p-0 relative h-52">
            <div className="w-full h-full bg-muted flex items-center justify-center overflow-hidden">
              <Image
                src={currentPhotoUrl}
                alt={`Photo of ${politician.name}`}
                width={320} 
                height={208} 
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                onError={() => setCurrentPhotoUrl('/placeholder-person.png')}
                priority={false} 
                data-ai-hint="politician photo"
              />
            </div>
          </CardHeader>
        </a>
      </Link>
      
      <CardContent className="p-4 flex-grow">
        <Link href={`/politicians/${politician.id}`} passHref legacyBehavior>
          <a className="block group">
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
              {politician.name}
            </CardTitle>
            {politician.name_nepali && (
              <p className="text-sm text-muted-foreground mb-2 group-hover:text-primary-focus transition-colors">{politician.name_nepali}</p>
            )}
          </a>
        </Link>

        {politician.current_position_title && politician.current_position_title !== 'N/A' && (
          <div className="flex items-center text-xs text-muted-foreground mt-2">
            <Briefcase className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span className="truncate">{politician.current_position_title}</span>
          </div>
        )}
        {politician.current_party_name && politician.current_party_name !== 'N/A' && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Users className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span className="truncate">{politician.current_party_name}</span>
          </div>
        )}
        {politician.public_criminal_records && politician.public_criminal_records.trim() !== "" && politician.public_criminal_records.toLowerCase() !== 'none' && (
          <div className="mt-2.5">
            <Badge variant="destructive" className="text-xs font-normal py-0.5 px-1.5">
              <FileWarning className="h-3 w-3 mr-1" />
              Record
            </Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 bg-muted/30 dark:bg-card-foreground/5 border-t dark:border-border/30 flex justify-between items-center">
        <div className="flex items-center space-x-1">
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleVote('up')}
            className={cn("px-2 h-8", userVoteStatus === 'up' && "bg-green-100 text-green-600 hover:bg-green-200")}
            disabled={isLoadingVoteStatus || isPending}
            title="Upvote"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <span className={cn("text-sm font-medium min-w-[20px] text-center", 
            currentVoteScore > 0 && "text-green-600",
            currentVoteScore < 0 && "text-red-600",
          )}>
            {currentVoteScore}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleVote('down')}
            className={cn("px-2 h-8", userVoteStatus === 'down' && "bg-red-100 text-red-600 hover:bg-red-200")}
            disabled={isLoadingVoteStatus || isPending}
            title="Downvote"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant={isFollowed ? "secondary" : "outline"} 
            size="sm" 
            onClick={handleFollowToggle}
            className="text-xs h-8 px-2.5"
            disabled={isLoadingFollowStatus || isPending}
            title={isFollowed ? 'Unfollow' : 'Follow'}
          >
            {isPending && isLoadingFollowStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className={`h-3.5 w-3.5 ${isFollowed ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />}
            <span className="ml-1.5 hidden sm:inline">{isPending && isLoadingFollowStatus ? '...' : (isFollowed ? 'Following' : 'Follow')}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare} title="Share Profile" className="h-8 w-8">
            <Share2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PoliticianCard;
