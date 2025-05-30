// src/components/politicians/profile/CareerTimeline.tsx
import React from 'react';
import { Briefcase } from 'lucide-react'; 

interface JourneyItem {
  position: string;
  party?: string | null;
  startDate: string; 
  endDate?: string | null;
  description?: string | null;
}

interface CareerTimelineProps {
  politicalJourney?: JourneyItem[] | string | null;
}

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'Present';
  try {
    if (/^\d{4}$/.test(dateString)) { // Check if the date string is just a year
        return dateString; 
    }
    // Attempt to format more complete dates
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    // If parsing fails, return the original string; it might be a different format or non-standard.
    return dateString; 
  }
};

const CareerTimeline: React.FC<CareerTimelineProps> = ({ politicalJourney }) => {
  let journeyEntries: JourneyItem[] = [];

  if (typeof politicalJourney === 'string' && politicalJourney.trim() !== "") {
    try {
      const parsed = JSON.parse(politicalJourney);
      if (Array.isArray(parsed)) {
        journeyEntries = parsed.filter(item => typeof item === 'object' && item !== null && item.position && item.startDate);
      } else {
        console.warn("Parsed political journey is not an array:", parsed);
        // Optionally, create a single error item to display
        journeyEntries.push({ position: "Data format error", startDate: new Date().toISOString(), description: "Expected an array of journey items." });
      }
    } catch (e) {
      console.error("Failed to parse political journey JSON:", e);
      return <p className="text-sm text-red-500">Political journey data could not be loaded due to a formatting error.</p>;
    }
  } else if (Array.isArray(politicalJourney)) {
    journeyEntries = politicalJourney.filter(item => typeof item === 'object' && item !== null && item.position && item.startDate);
  }

  if (journeyEntries.length === 0) {
    return <p className="text-muted-foreground italic text-sm">No political journey information has been provided.</p>;
  }

  try {
    journeyEntries.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  } catch (e) {
    console.error("Error sorting journey entries by date:", e);
    // If sorting fails due to invalid dates, proceed with unsorted or partially sorted data.
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.125rem] md:before:ml-5 before:h-full before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
      {journeyEntries.map((item, index) => (
        <div key={index} className="relative pl-8 md:pl-10">
          <div className="absolute left-[-0.125rem] md:left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background dark:ring-gray-900 shadow-md">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 md:p-4 ml-3 md:ml-4 hover:shadow-lg transition-shadow duration-200">
            <h4 className="font-semibold text-base md:text-md mb-0.5 text-primary dark:text-sky-400">{item.position}</h4>
            {item.party && (
              <p className="text-xs md:text-sm text-muted-foreground font-medium">{item.party}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(item.startDate)} &ndash; {formatDate(item.endDate)}
            </p>
            {item.description && (
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CareerTimeline;
