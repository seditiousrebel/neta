
// src/components/politicians/profile/CareerTimeline.tsx
import React from 'react';
import { Briefcase, GraduationCap, Milestone } from 'lucide-react';
import type { CareerJourneyEntry, PoliticianPosition } from '@/types/entities';

interface CareerTimelineProps {
  politicalJourney?: CareerJourneyEntry[] | string | null;
  positions?: PoliticianPosition[] | null;
}

interface TimelineItem {
  id: string;
  type: 'journey' | 'position';
  date: Date;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  icon: React.ElementType;
}

const formatDateForDisplay = (dateString?: string | null): string => {
  if (!dateString) return 'Date N/A';
  try {
    if (/^\d{4}$/.test(dateString)) return dateString; // Just a year
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Invalid date string
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }); // Day can be added if needed
  } catch (e) {
    return dateString; // Return original if parsing fails
  }
};

const CareerTimeline: React.FC<CareerTimelineProps> = ({ politicalJourney, positions }) => {
  let journeyEntries: CareerJourneyEntry[] = [];

  if (typeof politicalJourney === 'string' && politicalJourney.trim() !== "") {
    try {
      const parsed = JSON.parse(politicalJourney);
      if (Array.isArray(parsed)) {
        journeyEntries = parsed.filter(item => typeof item === 'object' && item !== null && (item.position || item.title || item.degree) && (item.startDate || item.year));
      } else if (typeof parsed === 'object' && parsed !== null) {
        journeyEntries = [parsed as CareerJourneyEntry];
      }
    } catch (e) {
      console.warn("Failed to parse political journey JSON, displaying as raw text:", e);
      journeyEntries = [{ position: "Political journey data is malformed.", startDate: new Date().toISOString(), description: politicalJourney.substring(0, 200) + "..." }];
    }
  } else if (Array.isArray(politicalJourney)) {
    journeyEntries = politicalJourney.filter(item => typeof item === 'object' && item !== null && (item.position || item.title || item.degree) && (item.startDate || item.year));
  }


  const combinedItems: TimelineItem[] = [];

  journeyEntries.forEach((entry, index) => {
    const dateToSortBy = entry.startDate || entry.year || new Date(0).toISOString(); // Fallback for sorting
    let icon = Milestone;
    if (entry.type === 'Education' || entry.degree) icon = GraduationCap;
    else if (entry.position || entry.type === 'Position Held') icon = Briefcase;

    combinedItems.push({
      id: `journey-${entry.id || index}`,
      type: 'journey',
      date: new Date(dateToSortBy),
      title: entry.title || entry.position || entry.degree || 'Career Event',
      subtitle: entry.organization || entry.institution || entry.party,
      description: entry.description || entry.details,
      icon: icon,
    });
  });

  (positions ?? []).forEach(pos => {
    if (pos.start_date) {
      combinedItems.push({
        id: `pos-${pos.id}`,
        type: 'position',
        date: new Date(pos.start_date),
        title: pos.position_titles?.title || 'Position Held',
        subtitle: pos.description || (pos.is_current ? 'Current Role' : ''),
        description: pos.description,
        icon: Briefcase,
      });
    }
  });

  if (combinedItems.length === 0) {
    return <p className="text-muted-foreground italic text-sm">No career or political journey information available.</p>;
  }

  const sortedTimeline = combinedItems.sort((a, b) => b.date.getTime() - a.date.getTime()); // Most recent first

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
      {sortedTimeline.map((item) => {
        const IconComponent = item.icon;
        return (
          <div key={item.id} className="relative pl-12">
            <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background dark:ring-gray-900 shadow-md">
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 md:p-4 ml-3 md:ml-4 hover:shadow-lg transition-shadow duration-200">
              <h4 className="font-semibold text-base md:text-md mb-0.5 text-primary dark:text-sky-400">{item.title}</h4>
              {item.subtitle && (
                <p className="text-xs md:text-sm text-muted-foreground font-medium">{item.subtitle}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDateForDisplay(item.date.toISOString())}
                {/* Assuming end date might be on journey items, not handled yet for display here */}
              </p>
              {item.description && (
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CareerTimeline;

    