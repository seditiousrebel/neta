
import { Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string; // ISO date string
  read: boolean;
  type: 'update' | 'mention' | 'vote';
}

const notifications: NotificationItem[] = [
  {
    id: '1',
    title: 'New Bill Proposed: Clean Air Act 2024',
    description: 'Senator Evelyn Reed has proposed a new bill focusing on stricter emission standards.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    read: false,
    type: 'update',
  },
  {
    id: '2',
    title: 'Your followed politician John Doe made a new promise.',
    description: '"Reduce city taxes by 5% in the first year."',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    read: true,
    type: 'update',
  },
  {
    id: '3',
    title: 'You were mentioned in a comment',
    description: 'User @PoliticalAnalyst replied to your comment on "Healthcare Reform Bill HR-5670".',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    read: false,
    type: 'mention',
  },
   {
    id: '4',
    title: 'Promise Status Update',
    description: 'Mayor Thompson\'s pledge for "10 New Parks" is now "In Progress".',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), // 25 hours ago
    read: true,
    type: 'update',
  }
];

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.read ? 'opacity-70' : ''}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{notification.title}</CardTitle>
                  {!notification.read && <Badge variant="destructive">New</Badge>}
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  {new Date(notification.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{notification.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-8 text-center text-muted-foreground flex flex-col items-center justify-center py-12">
          <Bell className="h-16 w-16 mb-4 text-primary/50" />
          <p className="text-xl">No new notifications.</p>
          <p className="text-sm">We'll let you know when something important happens.</p>
        </div>
      )}
    </div>
  );
}
