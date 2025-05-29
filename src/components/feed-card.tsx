
"use client";

import type { FeedItemData } from '@/types/entities';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Heart, Edit3, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

interface FeedCardProps {
  item: FeedItemData;
}

export function FeedCard({ item }: FeedCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [isFollowed, setIsFollowed] = useState(item.isFollowed);
  const [currentVotes, setCurrentVotes] = useState(item.votes);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(item.userVote || null);

  // Effect to handle initial hydration mismatch for Math.random based properties if any
  // For now, this component doesn't use Math.random directly for rendering.
  // But if it did, for example unique IDs not based on item.id:
  const [componentId, setComponentId] = useState<string | null>(null);
  useEffect(() => {
    setComponentId(`feed-card-${item.id}`);
  }, [item.id]);


  const handleFollow = () => {
    if (!isAuthenticated) {
      toast({ title: "Authentication Required", description: "Please log in to follow items.", variant: "destructive" });
      return;
    }
    setIsFollowed(!isFollowed);
    toast({ title: !isFollowed ? "Followed!" : "Unfollowed", description: `You are now ${!isFollowed ? 'following' : 'no longer following'} ${item.title}.` });
  };

  const handleVote = (voteType: "up" | "down") => {
    if (!isAuthenticated) {
      toast({ title: "Authentication Required", description: "Please log in to vote.", variant: "destructive" });
      return;
    }
    
    let newVotes = currentVotes;
    if (userVote === voteType) { // User is undoing their vote
      newVotes = voteType === "up" ? newVotes - 1 : newVotes + 1;
      setUserVote(null);
    } else {
      if (userVote === "up") newVotes--; // Was upvoted, now changing
      if (userVote === "down") newVotes++; // Was downvoted, now changing
      
      newVotes = voteType === "up" ? newVotes + 1 : newVotes - 1;
      setUserVote(voteType);
    }
    setCurrentVotes(newVotes);
  };

  const handleEdit = () => {
    if (!isAuthenticated) {
      toast({ title: "Authentication Required", description: "Please log in to edit items.", variant: "destructive" });
      return;
    }
    // Placeholder for edit functionality
    toast({ title: "Edit Clicked", description: `Edit action for ${item.title}. Moderation & version history would apply.` });
    console.log(`Edit ${item.entityType}: ${item.title}`);
  };
  
  const entityTypeToHumanReadable = (type: FeedItemData['entityType']) => {
    switch(type) {
      case 'politician': return 'Politician';
      case 'party': return 'Party';
      case 'promise': return 'Promise';
      case 'bill': return 'Legislative Bill';
      default: return 'Update';
    }
  }

  if (!componentId) {
    return (
      <Card className="w-full shadow-lg rounded-xl overflow-hidden">
        <div className="animate-pulse">
          <div className="h-48 bg-muted"></div>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="h-8 bg-muted rounded w-24"></div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-muted rounded-full"></div>
              <div className="h-8 w-8 bg-muted rounded-full"></div>
              <div className="h-8 w-8 bg-muted rounded-full"></div>
            </div>
          </CardFooter>
        </div>
      </Card>
    );
  }

  return (
    <Card data-testid={componentId} className="w-full shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {item.imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={item.imageUrl}
            alt={item.title}
            layout="fill"
            objectFit="cover"
            data-ai-hint={`${item.entityType} image`}
          />
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold">{item.title}</CardTitle>
          <Badge variant="outline" className="capitalize shrink-0 ml-2">{entityTypeToHumanReadable(item.entityType)}</Badge>
        </div>
        {item.author && <CardDescription className="text-xs text-muted-foreground">By {item.author} &bull; {new Date(item.timestamp).toLocaleDateString()}</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80 line-clamp-3">{item.summary}</p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={() => handleVote("up")} className={cn(userVote === "up" && "text-primary bg-primary/10")}>
            <ArrowUp className="h-4 w-4 mr-1" /> {userVote === 'up' ? currentVotes : (userVote === 'down' ? currentVotes : currentVotes)}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleVote("down")} className={cn(userVote === "down" && "text-destructive bg-destructive/10")}>
            <ArrowDown className="h-4 w-4 mr-1" />
          </Button>
          <Button variant="ghost" size="sm">
             <MessageCircle className="h-4 w-4 mr-1" /> Comments
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleFollow} title={isFollowed ? "Unfollow" : "Follow"}>
            <Heart className={cn("h-5 w-5", isFollowed ? "fill-destructive text-destructive" : "text-muted-foreground")} />
          </Button>
          {isAuthenticated && ( // Simplified condition, real app might check permissions
            <Button variant="ghost" size="icon" onClick={handleEdit} title="Edit">
              <Edit3 className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
