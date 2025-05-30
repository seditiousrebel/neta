// src/components/politicians/profile/CriminalRecords.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Gavel, Info } from 'lucide-react';

export interface CriminalRecordItem {
  id?: string; 
  case_name?: string;
  case_description?: string;
  offense_date?: string; // Changed from 'date' to match editor
  court_name?: string; // Added to match editor
  case_status?: 'Pending' | 'Convicted' | 'Acquitted' | 'Discharged' | string; // Matched editor
  sentence_details?: string; // Added to match editor
  relevant_laws?: string; // Added to match editor
  [key: string]: any;
}

interface CriminalRecordsProps {
  criminalRecordsData?: CriminalRecordItem[] | string | null;
}

const formatDate = (dateString?: string | null): string | null => {
  if (!dateString) return null;
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) { // Basic YYYY-MM-DD check
      const date = new Date(dateString + "T00:00:00"); // Ensure it's parsed as local date
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (/^\d{4}$/.test(dateString)) {
      return dateString;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) { 
      return dateString; 
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return dateString; 
  }
};

const getStatusBadgeVariant = (status?: string): 'default' | 'destructive' | 'secondary' | 'outline' | 'success' | 'warning' => {
  switch (status?.toLowerCase()) {
    case 'resolved':
    case 'dismissed':
    case 'acquitted': 
      return 'success';
    case 'convicted':
      return 'destructive';
    case 'pending':
    case 'appealed':
      return 'warning';
    default:
      return 'outline';
  }
};

const StatusIcon = ({ status }: { status?: string }) => {
    switch (status?.toLowerCase()) {
        case 'resolved':
        case 'dismissed':
        case 'acquitted':
            return <CheckCircle className="h-4 w-4 mr-1.5 text-green-500" />;
        case 'convicted':
             return <Gavel className="h-4 w-4 mr-1.5 text-red-500" />;
        case 'pending':
        case 'appealed':
            return <AlertTriangle className="h-4 w-4 mr-1.5 text-yellow-500" />;
        default:
            return <Info className="h-4 w-4 mr-1.5 text-gray-500" />;
    }
};

const CriminalRecordsDisplay: React.FC<CriminalRecordsProps> = ({ criminalRecordsData }) => {
  let records: CriminalRecordItem[] = [];
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
        records = parsed.filter(item => typeof item === 'object' && item !== null && (item.case_name || item.case_description || item.details || item.offense_date || Object.keys(item).length > 0));
      } else if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0) {
        records = [parsed as CriminalRecordItem];
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
    records = criminalRecordsData.filter(item => typeof item === 'object' && item !== null && (item.case_name || item.case_description || item.details || item.offense_date || Object.keys(item).length > 0));
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
              {record.case_name || record.case_description || "Case Record"}
            </CardTitle>
            {record.case_name && record.case_description && (
                 <CardDescription className="text-xs pt-1">{record.case_description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="text-xs md:text-sm space-y-1.5 pt-0 pb-4">
            {record.offense_date && <p><strong className="text-muted-foreground">Offense Date:</strong> {formatDate(record.offense_date) || <span className="italic">N/A</span>}</p>}
            {record.case_status && <p><strong className="text-muted-foreground">Status:</strong> <Badge variant={getStatusBadgeVariant(record.case_status)} className="text-xs px-1.5 py-0.5">{record.case_status}</Badge></p>}
            {record.court_name && <p><strong className="text-muted-foreground">Court:</strong> {record.court_name}</p>}
            {record.sentence_details && <p><strong className="text-muted-foreground">Sentence:</strong> {record.sentence_details}</p>}
            {record.relevant_laws && <p><strong className="text-muted-foreground">Laws:</strong> {record.relevant_laws}</p>}
            {record.details && ( // Assuming 'details' field is still relevant if not directly in editor
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-primary font-medium">More Details</summary>
                <p className="mt-1 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/50 p-2 rounded border dark:border-gray-600">{record.details}</p>
              </details>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CriminalRecordsDisplay;
