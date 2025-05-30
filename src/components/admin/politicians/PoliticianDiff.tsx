// src/components/admin/politicians/PoliticianDiff.tsx
"use client";

import React from 'react';
// Assuming PoliticianFormData is exported from PoliticianForm.tsx
// If not, this import will fail, and the type definition might need to be moved to a shared location.
import type { PoliticianFormData } from '@/components/contribute/PoliticianForm'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PoliticianDiffProps {
  oldData?: Partial<PoliticianFormData> | null; 
  newData: PoliticianFormData; 
  entityId?: string | number | null; 
}

// Simple component to render a label and value, skipping if value is empty/null
const DataField: React.FC<{ label: string; value: any; oldValue?: any; isChanged?: boolean }> = ({ label, value, oldValue, isChanged }) => {
    const displayValue = value !== undefined && value !== null ? (typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)) : "Not provided";
    const displayOldValue = oldValue !== undefined && oldValue !== null ? (typeof oldValue === 'object' ? JSON.stringify(oldValue, null, 2) : String(oldValue)) : "";

    // Determine if the field itself is considered "empty" for rendering purposes
    const isValueEffectivelyEmpty = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    const isOldValueEffectivelyEmpty = oldValue === undefined || oldValue === null || (typeof oldValue === 'string' && oldValue.trim() === '');

    if (isValueEffectivelyEmpty && isOldValueEffectivelyEmpty && !isChanged) {
        // If both new and old are empty and it's not marked as a change (e.g. explicit null vs undefined), don't render
        return null;
    }
    
    let changeIndicator = "";
    if (isChanged) {
        if (!isValueEffectivelyEmpty && isOldValueEffectivelyEmpty) changeIndicator = "(New field)";
        else if (isValueEffectivelyEmpty && !isOldValueEffectivelyEmpty) changeIndicator = "(Field removed)";
        else changeIndicator = "(Changed)";
    }


    return (
        <div className={`py-1.5 border-b border-gray-100 ${isChanged ? 'bg-blue-50 p-2 rounded-md my-1' : 'p-2'}`}>
            <span className="font-semibold text-sm text-muted-foreground">{label} {isChanged && <span className="text-xs text-blue-600">{changeIndicator}</span>}</span>
            <pre className={`text-sm whitespace-pre-wrap ${isChanged ? 'text-blue-700' : 'text-gray-800'}`}>{displayValue}</pre>
            {isChanged && !isOldValueEffectivelyEmpty && changeIndicator === "(Changed)" && (
                <p className="text-xs text-orange-600 ml-2 pl-2 border-l-2 border-orange-300 mt-0.5">
                    <span className="italic">Was:</span> <pre className="inline whitespace-pre-wrap">{displayOldValue}</pre>
                </p>
            )}
        </div>
    );
};


const PoliticianDiff: React.FC<PoliticianDiffProps> = ({ oldData, newData, entityId }) => {
  if (!entityId || !oldData) {
    // This is a new politician submission
    return (
      <Card>
        <CardHeader>
          <CardTitle>New Politician Submission</CardTitle>
          <CardDescription>This is a proposal for a new politician. All data shown below is part of this new submission. No previous data to compare.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <h3 className="font-semibold text-md mb-2 mt-3">Proposed Data:</h3>
          {Object.entries(newData).map(([key, value]) => {
            const formattedKey = key.replace(/_/g, ' ').replace(/\w/g, l => l.toUpperCase());
            // For new submissions, isChanged is false, oldValue is undefined
            return <DataField key={key} label={formattedKey} value={value} isChanged={false} />;
          })}
        </CardContent>
      </Card>
    );
  }

  // For edits to existing politicians:
  const allKeys = Array.from(new Set([...Object.keys(oldData || {}), ...Object.keys(newData)]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Politician Edit</CardTitle>
        <CardDescription>Comparing proposed changes to the existing record. Highlighted fields indicate differences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1"> {/* Reduced space-y for denser packing */}
        <div> 
            {allKeys.map((key) => {
                const newValue = (newData as any)[key];
                const currentOldValue = (oldData as any)[key];
                const formattedKey = key.replace(/_/g, ' ').replace(/\w/g, l => l.toUpperCase());
                
                const isValueChanged = JSON.stringify(currentOldValue) !== JSON.stringify(newValue);

                // Skip rendering if both old and new values are effectively empty and not part of a change
                const isNewValueEffectivelyEmpty = newValue === undefined || newValue === null || (typeof newValue === 'string' && newValue.trim() === '');
                const isOldValueEffectivelyEmpty = currentOldValue === undefined || currentOldValue === null || (typeof currentOldValue === 'string' && currentOldValue.trim() === '');
                if (isNewValueEffectivelyEmpty && isOldValueEffectivelyEmpty && !isValueChanged) {
                    return null;
                }
                
                return (
                    <DataField 
                        key={key} 
                        label={formattedKey} 
                        value={newValue} 
                        oldValue={currentOldValue}
                        isChanged={isValueChanged} 
                    />
                );
            })}
        </div>
        <p className="text-xs text-muted-foreground mt-4 pt-2 border-t">
          This is a basic comparison. A more sophisticated field-by-field highlighting (e.g., text diffs) will be implemented when the edit functionality (Prompt 9) is fully developed.
        </p>
      </CardContent>
    </Card>
  );
};

export default PoliticianDiff;
