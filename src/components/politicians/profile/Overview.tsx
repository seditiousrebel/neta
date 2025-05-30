// src/components/politicians/profile/Overview.tsx
import React from 'react';

interface OverviewProps {
  biography?: string | null;
  politicalJourney?: any[] | string | null; 
  currentPosition?: string | null;
  currentParty?: string | null;
}

const Overview: React.FC<OverviewProps> = ({ 
  biography, 
  politicalJourney, 
  currentPosition, 
  currentParty 
}) => {
  let journeyEntries: any[] = [];
  if (typeof politicalJourney === 'string' && politicalJourney.trim() !== "") {
    try {
      journeyEntries = JSON.parse(politicalJourney);
      if (!Array.isArray(journeyEntries)) journeyEntries = [];
    } catch (e) {
      console.warn("Failed to parse political journey JSON in Overview:", e);
      journeyEntries = [{ position: "Could not parse political journey data.", party: politicalJourney, isError: true }];
    }
  } else if (Array.isArray(politicalJourney)) {
    journeyEntries = politicalJourney;
  }

  const recentRoles = journeyEntries
    .filter(role => !role.isError && (!role.endDate || new Date(role.endDate).getFullYear() >= new Date().getFullYear() - 2)) // Approx last 2 years or ongoing
    .slice(-2) 
    .reverse(); 

  return (
    <div className="space-y-6 text-sm">
      {(currentPosition || currentParty) && (
        <section>
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Current Engagement</h3>
          {currentPosition && <p><strong className="text-muted-foreground">Position:</strong> {currentPosition}</p>}
          {currentParty && <p><strong className="text-muted-foreground">Party:</strong> {currentParty}</p>}
        </section>
      )}

      {biography && (
        <section>
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Biography</h3>
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            <p>{biography}</p>
          </div>
        </section>
      )}

      {recentRoles.length > 0 && (!currentPosition && !currentParty) && ( // Show only if not covered by explicit current roles
        <section>
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Recent Political Roles</h3>
          <ul className="list-disc pl-5 space-y-2">
            {recentRoles.map((role, index) => (
              <li key={index}>
                <span className="font-medium">{role.position}</span>
                {role.party && <span className="text-muted-foreground"> ({role.party})</span>}
                <div className="text-xs text-muted-foreground">
                  {role.startDate && `From: ${new Date(role.startDate).toLocaleDateString()}`}
                  {role.endDate && ` - To: ${new Date(role.endDate).toLocaleDateString()}`}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      
      {journeyEntries.length === 0 && !biography && !currentPosition && !currentParty && (
        <p className="text-muted-foreground italic">No overview information available for this politician.</p>
      )}
    </div>
  );
};

export default Overview;
