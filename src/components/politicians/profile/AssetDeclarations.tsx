// src/components/politicians/profile/AssetDeclarations.tsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";

export interface AssetDeclarationItem {
  id?: string; 
  year: number | string;
  description_of_assets: string; 
  total_value_approx?: number | string | null; 
  source_of_income?: string;
  remarks?: string;
  [key: string]: any;
}

interface AssetDeclarationsProps {
  assetDeclarationsData?: AssetDeclarationItem[] | string | null;
}

const AssetDeclarationsDisplay: React.FC<AssetDeclarationsProps> = ({ assetDeclarationsData }) => {
  let declarations: AssetDeclarationItem[] = [];
  let parseError = false;
  let rawDataDisplay: string | null = null;

  if (typeof assetDeclarationsData === 'string' && assetDeclarationsData.trim() !== "") {
    const lowerData = assetDeclarationsData.toLowerCase();
    if (lowerData === 'none' || lowerData === 'n/a' || lowerData === 'no asset declarations' || lowerData === '[]' || lowerData === '{}') {
      return <p className="text-muted-foreground italic py-4">No asset declarations available for this politician.</p>;
    }
    try {
      const parsed = JSON.parse(assetDeclarationsData);
      if (Array.isArray(parsed)) {
        declarations = parsed.filter(item => typeof item === 'object' && item !== null && (item.year || item.description_of_assets || item.total_value_approx || Object.keys(item).length > 0));
      } else if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0) {
        declarations = [parsed as AssetDeclarationItem];
      } else {
        if (Object.keys(parsed).length === 0 && !Array.isArray(parsed)) {
             return <p className="text-muted-foreground italic py-4">No asset declarations information provided.</p>;
        }
        parseError = true;
        rawDataDisplay = `Data format not recognized as a list of records: ${assetDeclarationsData.substring(0,100)}...`;
      }
      if (declarations.length === 0 && !parseError) {
          return <p className="text-muted-foreground italic py-4">No asset declarations information provided.</p>;
      }
    } catch (e) {
      console.warn("Failed to parse asset declarations JSON, attempting to display as raw text:", e);
      if (assetDeclarationsData.length < 200) {
          rawDataDisplay = assetDeclarationsData;
          parseError = true;
      } else {
          rawDataDisplay = "Asset declarations data is present but could not be displayed in structured format.";
          parseError = true;
      }
    }
  } else if (Array.isArray(assetDeclarationsData)) {
    declarations = assetDeclarationsData.filter(item => typeof item === 'object' && item !== null && (item.year || item.description_of_assets || item.total_value_approx || Object.keys(item).length > 0));
  }
  
  if (parseError && rawDataDisplay) {
    return (
        <div>
            <p className="text-sm mb-2 text-orange-600">Asset declarations data notes:</p>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded whitespace-pre-wrap border dark:border-gray-700">{rawDataDisplay}</pre>
        </div>
    );
  }

  if (declarations.length === 0) {
    return (
      <p className="text-muted-foreground italic py-4">
        No asset declarations available for this politician.
      </p>
    );
  }

  const sortedData = [...declarations].sort((a, b) => {
    const yearA = String(a.year);
    const yearB = String(b.year);
    return yearB.localeCompare(yearA); // Sort by year descending
  });


  return (
    <div className="space-y-4">
      <Table>
        <TableCaption>A list of declared assets.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Year</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Source of Income</TableHead>
            <TableHead className="text-right">Declared Value (Approx.)</TableHead>
            <TableHead>Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((declaration, index) => (
            <TableRow key={declaration.id || index} className="hover:bg-muted/50">
              <TableCell className="font-medium">{String(declaration.year)}</TableCell>
              <TableCell>{declaration.description_of_assets || <span className="text-xs text-muted-foreground italic">N/A</span>}</TableCell>
              <TableCell>{declaration.source_of_income || <span className="text-xs text-muted-foreground italic">N/A</span>}</TableCell>
              <TableCell className="text-right">
                {declaration.total_value_approx !== undefined && declaration.total_value_approx !== null && String(declaration.total_value_approx).trim() !== ""
                  ? String(declaration.total_value_approx)
                  : <span className="text-xs text-muted-foreground italic">N/A</span>}
              </TableCell>
              <TableCell>{declaration.remarks || <span className="text-xs text-muted-foreground italic">N/A</span>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AssetDeclarationsDisplay;
