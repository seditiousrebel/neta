
import { FeedCard } from '@/components/feed-card';
import type { FeedItemData } from '@/types/entities';
import { Heart } from 'lucide-react';

const followedItems: FeedItemData[] = [
   {
    id: '2',
    entityType: 'party',
    title: 'The Future Forward Party Releases Their Economic Manifesto',
    summary: 'Detailing strategies for job growth and wealth redistribution, the manifesto has sparked debate across the political spectrum. Key points include tax reforms and investment in public infrastructure.',
    imageUrl: 'https://placehold.co/600x400.png',
    author: 'Political Analysis Today',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    votes: 88,
    isFollowed: true,
    userVote: 'up',
  },
  {
    id: '4',
    entityType: 'bill',
    title: 'Healthcare Reform Bill HR-5670 Passes Senate Vote',
    summary: 'The controversial healthcare reform bill has narrowly passed the Senate. It now heads to the President\'s desk for final approval. The bill aims to expand coverage but faces criticism over costs.',
    imageUrl: 'https://placehold.co/600x400.png',
    author: 'Capitol Hill Reporter',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    votes: -45,
    isFollowed: true,
    userVote: 'down',
  },
];


export default function FollowingPage() {
  // In a real app, this would fetch items the user is following.
  // For now, we simulate this with a pre-filtered list or check AuthContext.
  // const { isAuthenticated } = useAuth();
  // if (!isAuthenticated) return <p>Please log in to see your followed items.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Following</h1>
      {followedItems.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {followedItems.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="mt-8 text-center text-muted-foreground flex flex-col items-center justify-center py-12">
          <Heart className="h-16 w-16 mb-4 text-primary/50" />
          <p className="text-xl">You haven't followed anything yet.</p>
          <p className="text-sm">Start following politicians, parties, bills, or promises to see updates here.</p>
        </div>
      )}
    </div>
  );
}
