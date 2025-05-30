
// src/components/politicians/profile/CriminalRecordsDisplay.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Gavel, Info } from 'lucide-react';
import type { CriminalRecord } from '@/components/wiki/CriminalRecordEditor'; // Use the updated type

interface CriminalRecordsProps {
  criminalRecordsData?: CriminalRecord[] | string | null;
}

const formatDate = (dateString?: string | null): string | null => {
  if (!dateString) return null;
  try {
    // Check if it's just a year or YYYY-MM-DD
    if (/^\d{4}$/.test(dateString)) return dateString;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const date = new Date(dateString + "T00:00:00"); // Ensure it's parsed as local date if only date part
      if (isNaN(date.getTime())) return dateString; // Invalid date string
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    // Try general parsing for other formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) { 
      return dateString; // Return original if still invalid
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return dateString; // Return original if parsing fails
  }
};

const getStatusBadgeVariant = (status?: string): 'default' | 'destructive' | 'secondary' | 'outline' | 'success' | 'warning' => {
  switch (status?.toLowerCase()) {
    case 'acquitted':
    case 'discharged':
      return 'success';
    case 'convicted':
      return 'destructive';
    case 'pending':
      return 'warning';
    default:
      return 'outline';
  }
};

const StatusIcon = ({ status }: { status?: string }) => {
    switch (status?.toLowerCase()) {
        case 'acquitted':
        case 'discharged':
            return <CheckCircle className="h-4 w-4 mr-1.5 text-green-500" />;
        case 'convicted':
             return <Gavel className="h-4 w-4 mr-1.5 text-red-500" />;
        case 'pending':
            return <AlertTriangle className="h-4 w-4 mr-1.5 text-yellow-500" />;
        default:
            return <Info className="h-4 w-4 mr-1.5 text-gray-500" />;
    }
};

const CriminalRecordsDisplay: React.FC<CriminalRecordsProps> = ({ criminalRecordsData }) => {
  let records: CriminalRecord[] = [];
  let parseError = false;
  let rawDataDisplay: string | null = null;

  if (typeof criminalRecordsData === 'string' && criminalRecordsData.trim() !== "") {
    const lowerData = criminalRecordsData.toLowerCase();
    if (lowerData === 'none' || lowerData === 'n/a' || lowerData === 'no criminal records' || lowerData === '[]' || lowerData === '{}') {
      return <p className="text-muted-foreground italic text-sm py-4">No criminal records reported for this politician.</p>;
    }
    try {
      const parsed = JSON.parse(criminalRecordsData);
      if (Array.isArray(parsed)) {
        records = parsed.filter(item => typeof item === 'object' && item !== null && (item.case_description));
      } else if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0) {
        records = [parsed as CriminalRecord];
      } else {
        if (Object.keys(parsed).length === 0 && !Array.isArray(parsed)) {
             return <p className="text-muted-foreground italic text-sm py-4">No criminal records information provided.</p>;
        }
        parseError = true;
        rawDataDisplay = `Data format not recognized as a list of records: ${criminalRecordsData.substring(0,100)}...`;
      }
      if (records.length === 0 && !parseError) {
          return <p className="text-muted-foreground italic text-sm py-4">No criminal records information provided.</p>;
      }
    } catch (e) {
      console.warn("Failed to parse criminal records JSON, attempting to display as raw text:", e);
      if (criminalRecordsData.length < 200) { 
          rawDataDisplay = criminalRecordsData;
          parseError = true; 
      } else {
          rawDataDisplay = "Criminal records data is present but could not be displayed in structured format.";
          parseError = true;
      }
    }
  } else if (Array.isArray(criminalRecordsData)) {
    records = criminalRecordsData.filter(item => typeof item === 'object' && item !== null && (item.case_description));
  }

  if (parseError && rawDataDisplay) {
    return (
        <div>
            <p className="text-sm mb-2 text-orange-600">Criminal records data notes:</p>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded whitespace-pre-wrap border dark:border-gray-700">{rawDataDisplay}</pre>
        </div>
    );
  }

  if (records.length === 0) {
    return <p className="text-muted-foreground italic text-sm py-4">No criminal records information has been provided or applicable.</p>;
  }

  return (
    <div className="space-y-4">
      {records.map((record, index) => (
        <Card key={record.id || index} className="shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-800">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-md md:text-lg flex items-center font-semibold">
              <StatusIcon status={record.case_status} />
              {record.case_description || "Case Record"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs md:text-sm space-y-1.5 pt-0 pb-4">
            {record.offense_date && <p><strong className="text-muted-foreground">Offense Date:</strong> {formatDate(record.offense_date) || <span className="italic">N/A</span>}</p>}
            {record.case_status && record.case_status !== '' && <p><strong className="text-muted-foreground">Status:</strong> <Badge variant={getStatusBadgeVariant(record.case_status)} className="text-xs px-1.5 py-0.5">{record.case_status}</Badge></p>}
            {record.court_name && <p><strong className="text-muted-foreground">Court:</strong> {record.court_name}</p>}
            {record.sentence_details && <p><strong className="text-muted-foreground">Sentence:</strong> {record.sentence_details}</p>}
            {record.relevant_laws && <p><strong className="text-muted-foreground">Laws:</strong> {record.relevant_laws}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CriminalRecordsDisplay;
