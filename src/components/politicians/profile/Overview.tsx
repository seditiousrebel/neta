
// src/components/politicians/profile/Overview.tsx
import React from 'react';
import type { CareerJourneyEntry, DetailedPolitician, PoliticianPosition, PoliticianPartyMembership } from '@/types/entities'; // Assuming types are defined
import { Library, Pencil } from 'lucide-react'; // For education section
import type { ModalContentData } from '@/app/politicians/[id]/page'; // Adjust path if necessary
import { EditButton } from '@/components/wiki/EditButton';
import { RichTextEditor } from '@/components/wiki/RichTextEditor';


interface OverviewProps {
  politician: DetailedPolitician;
  currentPositionData?: PoliticianPosition | null;
  currentPartyData?: PoliticianPartyMembership | null;
  onOpenModal: (data: ModalContentData) => void;
  politicianId: string;
}

const Overview: React.FC<OverviewProps> = ({
  politician,
  currentPositionData,
  currentPartyData,
  onOpenModal,
  politicianId,
}) => {
  const { biography, education } = politician;
  let educationEntries: any[] = [];

  if (typeof education === 'string' && education.trim() !== "") {
    try {
      const parsed = JSON.parse(education);
      if (Array.isArray(parsed)) {
        educationEntries = parsed;
      } else if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0) {
        educationEntries = [parsed]; 
      } else {
        if (Object.keys(parsed).length === 0 && !Array.isArray(parsed)) {
           educationEntries = [{ rawText: "No educational details provided." }];
        } else {
          educationEntries = [{ rawText: education }]; 
        }
      }
    } catch (e) {
      console.warn("Failed to parse education JSON in Overview, displaying as raw text:", e);
      educationEntries = [{ rawText: education }];
    }
  } else if (Array.isArray(education)) {
    educationEntries = education;
  }


  return (
    <div className="space-y-6 text-sm">
      {(currentPositionData || currentPartyData) && (
        <section>
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Current Engagement</h3>
          {currentPositionData?.position_titles?.title && (
            <p><strong className="text-muted-foreground">Position:</strong> {currentPositionData.position_titles.title}</p>
          )}
          {currentPartyData?.parties?.name && (
            <p><strong className="text-muted-foreground">Party:</strong> {currentPartyData.parties.name}
            {currentPartyData.parties.abbreviation && ` (${currentPartyData.parties.abbreviation})`}
            </p>
          )}
        </section>
      )}

      {biography && (
        <section className="relative group">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Biography</h3>
            <EditButton
              onClick={() => onOpenModal({
                fieldName: 'bio',
                fieldLabel: 'Biography',
                currentValue: biography || '',
                fieldType: 'richtext',
                editorComponent: RichTextEditor,
                politicianId: politicianId,
              })}
              className="static opacity-100" // Make it always visible or adjust as needed
            />
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            <p>{biography}</p>
          </div>
        </section>
      )}
      {!biography && (
         <section className="relative group">
           <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Biography</h3>
            <EditButton
              onClick={() => onOpenModal({
                fieldName: 'bio',
                fieldLabel: 'Biography',
                currentValue: '',
                fieldType: 'richtext',
                editorComponent: RichTextEditor,
                politicianId: politicianId,
              })}
              className="static opacity-100"
            />
          </div>
          <p className="text-muted-foreground italic">No biography available.</p>
        </section>
      )}


      <section className="relative group">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold flex items-center text-gray-800 dark:text-gray-200">
                <Library className="h-5 w-5 mr-2 text-primary" />
                Education
            </h3>
            <EditButton
                onClick={() => onOpenModal({
                    fieldName: 'education',
                    fieldLabel: 'Education',
                    currentValue: education || '',
                    fieldType: 'textarea',
                    editorProps: { placeholder: 'Enter education details, ideally as JSON string or structured text.' },
                    politicianId: politicianId,
                })}
                className="static opacity-100"
            />
        </div>
        {educationEntries.length > 0 ? educationEntries.map((edu, index) => (
          <div key={index} className="mb-2 p-3 border rounded-md bg-muted/30 dark:bg-muted/10 shadow-sm">
            {edu.rawText ? (
              <p className="whitespace-pre-wrap">{edu.rawText}</p>
            ) : (
              <>
                {edu.degree && <p className="font-medium text-foreground">{edu.degree}</p>}
                {edu.institution && <p className="text-xs text-muted-foreground">{edu.institution}</p>}
                {edu.year && <p className="text-xs text-muted-foreground">Graduated: {edu.year}</p>}
                {edu.field_of_study && <p className="text-xs text-muted-foreground">Field: {edu.field_of_study}</p>}
                {edu.details && <p className="text-xs mt-1">{edu.details}</p>}
                {Object.entries(edu)
                  .filter(([key]) => !['degree', 'institution', 'year', 'field_of_study', 'details', 'id'].includes(key))
                  .map(([key, val]) => (
                    <p key={key} className="text-xs mt-0.5">
                      <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong> {String(val)}
                    </p>
                  ))}
              </>
            )}
          </div>
        )) : <p className="text-muted-foreground italic">No education details available.</p>}
      </section>

      {!biography && educationEntries.length === 0 && !currentPositionData && !currentPartyData && (
        <p className="text-muted-foreground italic">No overview information available for this politician.</p>
      )}
    </div>
  );
};

export default Overview;
    
