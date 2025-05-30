import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Edit3, Save, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EditorProps } from './EditModal';

export interface AssetDeclaration {
  id: string;
  year: number | string; // Allow string for input, parse to number
  description_of_assets: string;
  total_value_approx?: number | string; // Allow string for input, parse to number
  source_of_income?: string;
  remarks?: string;
}

export interface AssetDeclarationEditorProps extends EditorProps<AssetDeclaration[]> {
  // No additional props beyond EditorProps for now
}

export function AssetDeclarationEditor({
  value = [],
  onChange,
  disabled,
  id = 'asset-declarations-editor',
}: AssetDeclarationEditorProps) {
  const [declarations, setDeclarations] = useState<AssetDeclaration[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  useEffect(() => {
    setDeclarations(Array.isArray(value) ? value.map(d => ({ ...d, id: d.id || crypto.randomUUID() })) : []);
  }, [value]);

  const handleAddNewDeclaration = () => {
    const newDeclaration: AssetDeclaration = {
      id: crypto.randomUUID(),
      year: new Date().getFullYear(), // Default to current year
      description_of_assets: '',
      total_value_approx: '',
      source_of_income: '',
      remarks: '',
    };
    const updatedDeclarations = [...declarations, newDeclaration];
    setDeclarations(updatedDeclarations);
    onChange(updatedDeclarations);
    setEditingRecordId(newDeclaration.id);
  };

  const handleRemoveDeclaration = (recordId: string) => {
    const updatedDeclarations = declarations.filter((dec) => dec.id !== recordId);
    setDeclarations(updatedDeclarations);
    onChange(updatedDeclarations);
    if (editingRecordId === recordId) {
      setEditingRecordId(null);
    }
  };

  const handleFieldChange = (recordId: string, field: keyof AssetDeclaration, fieldValue: any) => {
    let processedValue = fieldValue;
    if ((field === 'year' || field === 'total_value_approx')) {
        // Allow empty string for optional number fields, otherwise parse
        processedValue = fieldValue === '' ? '' : parseFloat(fieldValue);
        if (field === 'year' && fieldValue !== '' && isNaN(processedValue)) processedValue = ''; // Prevent NaN for year if not empty
        if (field === 'total_value_approx' && fieldValue !== '' && isNaN(processedValue)) processedValue = ''; // Prevent NaN for total_value_approx if not empty
    }

    const updatedDeclarations = declarations.map((dec) =>
      dec.id === recordId ? { ...dec, [field]: processedValue } : dec
    );
    setDeclarations(updatedDeclarations);
  };

  const handleSaveDeclaration = (recordId: string) => {
    // Ensure numeric fields are numbers or undefined if empty string
    const finalDeclarations = declarations.map(dec => {
        if (dec.id === recordId) {
            return {
                ...dec,
                year: dec.year === '' ? new Date().getFullYear() : Number(dec.year), // Default to current year if empty
                total_value_approx: dec.total_value_approx === '' || dec.total_value_approx === undefined ? undefined : Number(dec.total_value_approx),
            };
        }
        return dec;
    });
    setDeclarations(finalDeclarations);
    onChange(finalDeclarations);
    setEditingRecordId(null);
  };
  
  const handleCancelEdit = (recordId: string) => {
    const originalRecord = Array.isArray(value) ? value.find(r => r.id === recordId) : undefined;
    if (originalRecord) {
      const revertedRecords = declarations.map(r => r.id === recordId ? originalRecord : r);
      setDeclarations(revertedRecords);
    }
    setEditingRecordId(null);
  };


  return (
    <div className={cn("space-y-4", !disabled && "p-4 border rounded-md")}>
      {declarations.map((dec) => (
        <Card key={dec.id} className="relative overflow-hidden">
          <CardHeader className="bg-muted/30 p-4">
            <CardTitle className="text-lg flex justify-between items-center">
              <span>Declaration: Year {dec.year}</span>
              {!disabled && editingRecordId !== dec.id && (
                 <Button variant="ghost" size="sm" onClick={() => setEditingRecordId(dec.id)} title="Edit Declaration">
                    <Edit3 className="h-4 w-4" />
                 </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {editingRecordId === dec.id && !disabled ? (
              // EDITING VIEW
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`year-${dec.id}`}>Year</Label>
                    <Input
                      id={`year-${dec.id}`}
                      type="number"
                      value={dec.year}
                      onChange={(e) => handleFieldChange(dec.id, 'year', e.target.value)}
                      placeholder="e.g., 2023"
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`total_value_approx-${dec.id}`}>Approx. Total Value (Optional)</Label>
                    <Input
                      id={`total_value_approx-${dec.id}`}
                      type="number"
                      value={dec.total_value_approx || ''}
                      onChange={(e) => handleFieldChange(dec.id, 'total_value_approx', e.target.value)}
                      placeholder="e.g., 500000"
                      disabled={disabled}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`description_of_assets-${dec.id}`}>Description of Assets</Label>
                  <Textarea
                    id={`description_of_assets-${dec.id}`}
                    value={dec.description_of_assets}
                    onChange={(e) => handleFieldChange(dec.id, 'description_of_assets', e.target.value)}
                    placeholder="Detailed description of all assets..."
                    className="min-h-[120px]"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label htmlFor={`source_of_income-${dec.id}`}>Source of Income (Optional)</Label>
                  <Textarea
                    id={`source_of_income-${dec.id}`}
                    value={dec.source_of_income || ''}
                    onChange={(e) => handleFieldChange(dec.id, 'source_of_income', e.target.value)}
                    placeholder="Describe sources of income..."
                    className="min-h-[80px]"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label htmlFor={`remarks-${dec.id}`}>Remarks (Optional)</Label>
                  <Textarea
                    id={`remarks-${dec.id}`}
                    value={dec.remarks || ''}
                    onChange={(e) => handleFieldChange(dec.id, 'remarks', e.target.value)}
                    placeholder="Any additional remarks..."
                    className="min-h-[80px]"
                    disabled={disabled}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleCancelEdit(dec.id)} title="Cancel Edit">
                        <XCircle className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button variant="default" size="sm" onClick={() => handleSaveDeclaration(dec.id)} title="Save Changes">
                        <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                </div>
              </>
            ) : (
              // DISPLAY VIEW
              <>
                <p><strong>Year:</strong> {dec.year}</p>
                <p><strong>Assets Description:</strong> {dec.description_of_assets || <span className="text-muted-foreground">N/A</span>}</p>
                <p><strong>Approx. Total Value:</strong> {dec.total_value_approx !== undefined && dec.total_value_approx !== '' ? dec.total_value_approx : <span className="text-muted-foreground">N/A</span>}</p>
                <p><strong>Source of Income:</strong> {dec.source_of_income || <span className="text-muted-foreground">N/A</span>}</p>
                <p><strong>Remarks:</strong> {dec.remarks || <span className="text-muted-foreground">N/A</span>}</p>
              </>
            )}
          </CardContent>
          {!disabled && editingRecordId !== dec.id && (
             <CardFooter className="p-2 border-t">
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveDeclaration(dec.id)}
                    className="w-full"
                    title="Remove Declaration"
                    disabled={disabled}
                >
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
            </CardFooter>
          )}
        </Card>
      ))}

      {!disabled && (
        <Button onClick={handleAddNewDeclaration} variant="outline" className="w-full mt-4" disabled={disabled}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add New Asset Declaration
        </Button>
      )}
      {disabled && declarations.length === 0 && (
        <p className="text-muted-foreground text-center">No asset declarations provided.</p>
      )}
    </div>
  );
}
