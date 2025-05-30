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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


interface AssetDeclarationRecord {
  year: number | string; // Year can be number or string like "2078/79"
  description: string;
  value: string;
  // Add any other relevant fields that might exist in the data
  details_link?: string; // Example of an optional field
  source_of_income?: string;
}

interface AssetDeclarationsProps {
  assetDeclarationsData?: AssetDeclarationRecord[] | null;
}

const AssetDeclarations: React.FC<AssetDeclarationsProps> = ({ assetDeclarationsData }) => {
  if (!assetDeclarationsData || assetDeclarationsData.length === 0) {
    return (
      <p className="text-muted-foreground italic py-4">
        No asset declarations available for this politician.
      </p>
    );
  }

  // Sort data by year, descending, assuming 'year' can be reliably sorted.
  // If year is like "2078/79", simple sort might not be ideal without parsing.
  // For now, a basic sort if year is consistently a number or simple string.
  const sortedData = [...assetDeclarationsData].sort((a, b) => {
    const yearA = String(a.year);
    const yearB = String(b.year);
    return yearB.localeCompare(yearA); // Sorts strings; for "2078/79" vs "2077/78" this works
  });


  return (
    // Removed the Card wrapper from here to match CriminalRecords component structure,
    // assuming the parent component (TabsContent value="assets") will use a Card.
    // If this component is used standalone, it might need its own Card.
    <div className="space-y-4">
      <Table>
        <TableCaption>A list of declared assets.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Year</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Source of Income (if any)</TableHead>
            <TableHead className="text-right">Declared Value</TableHead>
            {/* Add more heads if there are more common fields like details_link */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((declaration, index) => (
            <TableRow key={index} className="hover:bg-muted/50">
              <TableCell className="font-medium">{declaration.year}</TableCell>
              <TableCell>{declaration.description}</TableCell>
              <TableCell>{declaration.source_of_income || <span className="text-xs text-muted-foreground italic">N/A</span>}</TableCell>
              <TableCell className="text-right">{declaration.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AssetDeclarations;
