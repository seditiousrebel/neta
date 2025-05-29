
"use client";
import type { PoliticianPromise } from '@/types/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle, XCircle, CalendarClock } from 'lucide-react'; // Added CalendarClock for In Progress/Pending

interface PromisesSectionProps {
  promises?: PoliticianPromise[];
}

const statusIcons = {
  Fulfilled: <CheckCircle className="h-4 w-4 text-green-500" />,
  Broken: <XCircle className="h-4 w-4 text-red-500" />,
  'In Progress': <CalendarClock className="h-4 w-4 text-blue-500" />,
  Pending: <CalendarClock className="h-4 w-4 text-yellow-500" />,
  Overdue: <CalendarClock className="h-4 w-4 text-orange-500" />,
  Compromised: <AlertCircle className="h-4 w-4 text-purple-500" />, // Assuming AlertCircle for compromised
};

const statusColors: { [key: string]: string } = {
  Fulfilled: 'bg-green-100 text-green-700',
  Broken: 'bg-red-100 text-red-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Overdue: 'bg-orange-100 text-orange-700',
  Compromised: 'bg-purple-100 text-purple-700',
};


export default function PromisesSection({ promises = [] }: PromisesSectionProps) {
  if (promises.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Target className="mr-2 h-5 w-5 text-primary" /> Promises</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No promises found for this politician.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Placeholder for fulfillment rate calculation
  const fulfilledCount = promises.filter(p => p.status === 'Fulfilled').length;
  const totalTrackablePromises = promises.filter(p => p.status === 'Fulfilled' || p.status === 'Broken').length;
  const fulfillmentRate = totalTrackablePromises > 0 ? ((fulfilledCount / totalTrackablePromises) * 100).toFixed(0) : 'N/A';


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Target className="mr-2 h-5 w-5 text-primary" /> Promises</CardTitle>
        <CardDescription>
            Tracking commitments made by the politician. 
            {fulfillmentRate !== 'N/A' && <span className="font-semibold"> Fulfillment Rate: {fulfillmentRate}%</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {promises.map((promise) => (
          <div key={promise.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-semibold text-foreground">{promise.title}</h4>
              <Badge className={`capitalize ${statusColors[promise.status] || 'bg-gray-100 text-gray-700'}`}>
                {/* @ts-ignore TODO: Fix type for statusIcons or ensure status matches */}
                {statusIcons[promise.status] && React.cloneElement(statusIcons[promise.status], { className: 'mr-1.5 h-3 w-3' })}
                {promise.status}
              </Badge>
            </div>
            {promise.description && <p className="text-sm text-foreground/80 mb-1">{promise.description}</p>}
            {promise.due_date && (
                <p className="text-xs text-muted-foreground">Due: {new Date(promise.due_date).toLocaleDateString()}</p>
            )}
             {/* Placeholder for evidence links */}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
