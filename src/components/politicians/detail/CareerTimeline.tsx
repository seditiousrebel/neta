
"use client";

import type { PoliticianCareerEntry, PoliticianPosition } from '@/types/entities';
import { Briefcase, GraduationCap, Milestone, Building } from 'lucide-react'; // Added Building
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'; // Added this import

interface CareerTimelineProps {
  careerEntries?: PoliticianCareerEntry[];
  positions?: PoliticianPosition[];
}

interface TimelineItem {
  id: string;
  type: 'career' | 'position';
  date: Date; // For sorting. Use start_date.
  title: string;
  subtitle?: string | null;
  description?: string | null;
  icon: React.ElementType;
}

export default function CareerTimeline({ careerEntries = [], positions = [] }: CareerTimelineProps) {
  const combinedItems: TimelineItem[] = [];

  careerEntries.forEach(entry => {
    if (entry.start_date) {
      let icon = Milestone;
      if (entry.entry_type === 'Education') icon = GraduationCap;
      // Add more specific icons if needed for other career_entry_types

      combinedItems.push({
        id: `career-${entry.id}`,
        type: 'career',
        date: new Date(entry.start_date),
        title: entry.title,
        subtitle: entry.organization_name,
        description: entry.description,
        icon: icon,
      });
    }
  });

  positions.forEach(pos => {
    if (pos.start_date) {
      combinedItems.push({
        id: `pos-${pos.id}`,
        type: 'position',
        date: new Date(pos.start_date),
        title: pos.position_titles?.title || 'Position',
        subtitle: pos.description || (pos.is_current ? 'Current Role' : ''),
        description: pos.description,
        icon: Briefcase,
      });
    }
  });

  const sortedTimeline = combinedItems.sort((a, b) => b.date.getTime() - a.date.getTime()); // Most recent first

  if (sortedTimeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary" /> Career Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No career information available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary" /> Career Timeline</CardTitle>
        <CardDescription>A chronological overview of key roles and milestones.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 after:absolute after:inset-y-0 after:w-px after:bg-muted-foreground/20 after:left-0">
          {sortedTimeline.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div key={item.id} className="grid gap-1.5 pb-8 relative">
                <div className="absolute -left-[calc(0.75rem+1px)] top-1 flex size-3 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <IconComponent className="h-3 w-3 p-0.5" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {item.title}
                </p>
                {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                <time className="text-xs text-muted-foreground/80">
                  {format(item.date, 'MMMM yyyy')}
                  {/* Could add end date if available */}
                </time>
                {item.description && item.type === 'career' && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
