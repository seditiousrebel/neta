
"use client";
import type { PoliticianBillVote } from '@/types/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Layers, ExternalLink } from 'lucide-react'; // Using Layers for bills/votes
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface VotingHistoryProps {
  billVotes?: PoliticianBillVote[];
}

export default function VotingHistory({ billVotes = [] }: VotingHistoryProps) {
  if (billVotes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Layers className="mr-2 h-5 w-5 text-primary" /> Voting Record</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No voting records available for this politician.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Layers className="mr-2 h-5 w-5 text-primary" /> Voting Record</CardTitle>
        <CardDescription>Key votes on legislative bills.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {billVotes.map((vote) => (
          <div key={vote.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-1">
                <Link href={`/bills/${vote.legislative_bills?.id}`} className="font-semibold text-foreground hover:text-primary hover:underline">
                    {vote.legislative_bills?.title || 'N/A Bill Title'}
                </Link>
              <Badge 
                variant={
                  vote.vote === 'Yea' ? 'default' : 
                  vote.vote === 'Nay' ? 'destructive' : 
                  'secondary'
                }
                className="capitalize"
              >
                {vote.vote}
              </Badge>
            </div>
            {vote.legislative_bills?.bill_number && (
                <p className="text-xs text-muted-foreground">Bill Number: {vote.legislative_bills.bill_number}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Voted on: {new Date(vote.voted_at).toLocaleDateString()}
            </p>
            {vote.legislative_bills?.summary && (
                <p className="mt-2 text-sm text-foreground/80 line-clamp-2">{vote.legislative_bills.summary}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
