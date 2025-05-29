
import { FeedCard } from '@/components/feed-card';
import type { FeedItemData } from '@/types/entities';

// Placeholder feed data
const feedItems: FeedItemData[] = [
  {
    id: '1',
    entityType: 'politician',
    title: 'Senator Evelyn Reed Announces New Climate Initiative',
    summary: 'Senator Reed outlined a bold new plan to combat climate change, focusing on renewable energy and carbon capture technologies. The initiative aims to reduce national emissions by 30% by 2035.',
    imageUrl: 'https://placehold.co/600x400.png',
    author: 'National News Network',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    votes: 125,
    isFollowed: false,
    userVote: null,
  },
  {
    id: '2',
    entityType: 'party',
    title: 'The Future Forward Party Releases Their Economic Manifesto',
    summary: 'Detailing strategies for job growth and wealth redistribution, the manifesto has sparked debate across the political spectrum. Key points include tax reforms and investment in public infrastructure.',
    imageUrl: 'https://placehold.co/600x400.png',
    author: 'Political Analysis Today',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    votes: 88,
    isFollowed: true,
    userVote: 'up',
  },
  {
    id: '3',
    entityType: 'promise',
    title: 'Promise Tracker: Mayor Thompson\'s Pledge for 10 New Parks',
    summary: 'An update on Mayor Thompson\'s campaign promise to build 10 new public parks within the city. Two parks are currently under construction, with three more sites approved.',
    imageUrl: 'https://placehold.co/600x400.png',
    author: 'City Watch Group',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    votes: 230,
    isFollowed: false,
    userVote: null,
  },
  {
    id: '4',
    entityType: 'bill',
    title: 'Healthcare Reform Bill HR-5670 Passes Senate Vote',
    summary: 'The controversial healthcare reform bill has narrowly passed the Senate. It now heads to the President\'s desk for final approval. The bill aims to expand coverage but faces criticism over costs.',
    imageUrl: 'https://placehold.co/600x400.png',
    author: 'Capitol Hill Reporter',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    votes: -45,
    isFollowed: true,
    userVote: 'down',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">My Feed</h1>
      <section aria-labelledby="feed-items">
        <h2 id="feed-items" className="sr-only">Recent Updates</h2>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {feedItems.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
