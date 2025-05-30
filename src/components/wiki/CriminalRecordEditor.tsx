
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Edit3, Save, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EditorProps } from './EditModal';

export interface CriminalRecord {
  id: string;
  case_description: string; // Primary descriptive field
  offense_date?: string; // YYYY-MM-DD, optional
  court_name?: string; // Optional
  case_status?: 'Pending' | 'Convicted' | 'Acquitted' | 'Discharged' | ''; // Optional
  sentence_details?: string; // Optional
  relevant_laws?: string; // Optional
}

export interface CriminalRecordEditorProps extends EditorProps<CriminalRecord[]> {
  // No additional props beyond EditorProps for now
}

const caseStatusOptions: CriminalRecord['case_status'][] = ['Pending', 'Convicted', 'Acquitted', 'Discharged', ''];

export function CriminalRecordEditor({
  value = [],
  onChange,
  disabled,
  id = 'criminal-records-editor',
}: CriminalRecordEditorProps) {
  const [records, setRecords] = useState<CriminalRecord[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  useEffect(() => {
    setRecords(Array.isArray(value) ? value.map(r => ({ ...r, id: r.id || crypto.randomUUID() })) : []);
  }, [value]);

  const handleAddNewRecord = () => {
    const newRecord: CriminalRecord = {
      id: crypto.randomUUID(),
      case_description: '',
      offense_date: '',
      court_name: '',
      case_status: '',
      sentence_details: '',
      relevant_laws: '',
    };
    const updatedRecords = [...records, newRecord];
    setRecords(updatedRecords);
    onChange(updatedRecords);
    setEditingRecordId(newRecord.id);
  };

  const handleRemoveRecord = (recordId: string) => {
    const updatedRecords = records.filter((record) => record.id !== recordId);
    setRecords(updatedRecords);
    onChange(updatedRecords);
    if (editingRecordId === recordId) {
      setEditingRecordId(null);
    }
  };

  const handleFieldChange = (recordId: string, field: keyof CriminalRecord, fieldValue: any) => {
    const updatedRecords = records.map((record) =>
      record.id === recordId ? { ...record, [field]: fieldValue } : record
    );
    setRecords(updatedRecords);
  };
  
  const handleSaveRecord = (recordId: string) => {
    onChange(records);
    setEditingRecordId(null);
  };

  const handleCancelEdit = (recordId: string) => {
    const originalRecord = Array.isArray(value) ? value.find(r => r.id === recordId) : undefined;
    if (originalRecord) {
      const revertedRecords = records.map(r => r.id === recordId ? originalRecord : r);
      setRecords(revertedRecords);
    }
    setEditingRecordId(null);
  }

  return (
    <div className={cn("space-y-4", !disabled && "p-4 border rounded-md")}>
      {records.map((record) => (
        <Card key={record.id} className="relative overflow-hidden">
          <CardHeader className="bg-muted/30 p-4">
            <CardTitle className="text-lg flex justify-between items-center">
              <span>Case: {record.case_description.substring(0,30) || record.id.substring(0, 8)}...</span>
              {!disabled && editingRecordId !== record.id && (
                 <Button variant="ghost" size="sm" onClick={() => setEditingRecordId(record.id)} title="Edit Record">
                    <Edit3 className="h-4 w-4" />
                 </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {editingRecordId === record.id && !disabled ? (
              // EDITING VIEW
              <>
                <div>
                  <Label htmlFor={`case_description-${record.id}`}>Case Description/Title *</Label>
                  <Textarea
                    id={`case_description-${record.id}`}
                    value={record.case_description}
                    onChange={(e) => handleFieldChange(record.id, 'case_description', e.target.value)}
                    placeholder="Brief title or detailed description of the case..."
                    className="min-h-[100px]"
                    disabled={disabled}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`offense_date-${record.id}`}>Offense Date (Optional)</Label>
                    <Input
                      id={`offense_date-${record.id}`}
                      type="date" // Changed to date type for better UX
                      value={record.offense_date || ''}
                      onChange={(e) => handleFieldChange(record.id, 'offense_date', e.target.value)}
                      placeholder="YYYY-MM-DD"
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`court_name-${record.id}`}>Court Name (Optional)</Label>
                    <Input
                      id={`court_name-${record.id}`}
                      value={record.court_name || ''}
                      onChange={(e) => handleFieldChange(record.id, 'court_name', e.target.value)}
                      placeholder="e.g., Supreme Court"
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`case_status-${record.id}`}>Case Status (Optional)</Label>
                    <Select
                      value={record.case_status || ''}
                      onValueChange={(statusVal) => handleFieldChange(record.id, 'case_status', statusVal as CriminalRecord['case_status'])}
                      disabled={disabled}
                    >
                      <SelectTrigger id={`case_status-${record.id}`}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">(Clear Selection)</SelectItem>
                        {caseStatusOptions.filter(opt => opt !== '').map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <details className="mt-3 group">
                    <summary className="text-sm font-medium text-muted-foreground cursor-pointer group-hover:text-primary">
                        Optional Details (Sentence, Laws)
                    </summary>
                    <div className="mt-2 space-y-3 border-t pt-3">
                        <div>
                        <Label htmlFor={`sentence_details-${record.id}`}>Sentence Details</Label>
                        <Textarea
                            id={`sentence_details-${record.id}`}
                            value={record.sentence_details || ''}
                            onChange={(e) => handleFieldChange(record.id, 'sentence_details', e.target.value)}
                            placeholder="Details of conviction/sentence..."
                            className="min-h-[80px]"
                            disabled={disabled}
                        />
                        </div>
                        <div>
                        <Label htmlFor={`relevant_laws-${record.id}`}>Relevant Laws/Acts</Label>
                        <Textarea
                            id={`relevant_laws-${record.id}`}
                            value={record.relevant_laws || ''}
                            onChange={(e) => handleFieldChange(record.id, 'relevant_laws', e.target.value)}
                            placeholder="e.g., Penal Code Section 302"
                            className="min-h-[80px]"
                            disabled={disabled}
                        />
                        </div>
                    </div>
                </details>

                <div className="flex justify-end space-x-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleCancelEdit(record.id)} title="Cancel Edit">
                        <XCircle className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button variant="default" size="sm" onClick={() => handleSaveRecord(record.id)} title="Save Changes">
                        <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                </div>
              </>
            ) : (
              // DISPLAY VIEW
              <>
                <p><strong>Description:</strong> {record.case_description || <span className="text-muted-foreground">N/A</span>}</p>
                <p><strong>Offense Date:</strong> {record.offense_date ? new Date(record.offense_date + 'T00:00:00').toLocaleDateString() : <span className="text-muted-foreground">N/A</span>}</p> {/* Ensure date is parsed correctly for display */}
                <p><strong>Court:</strong> {record.court_name || <span className="text-muted-foreground">N/A</span>}</p>
                <p><strong>Status:</strong> {record.case_status || <span className="text-muted-foreground">N/A</span>}</p>
                {record.sentence_details && <p><strong>Sentence:</strong> {record.sentence_details}</p>}
                {record.relevant_laws && <p><strong>Laws:</strong> {record.relevant_laws}</p>}
              </>
            )}
          </CardContent>
          {!disabled && editingRecordId !== record.id && (
            <CardFooter className="p-2 border-t">
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveRecord(record.id)}
                    className="w-full"
                    title="Remove Record"
                    disabled={disabled}
                >
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
            </CardFooter>
          )}
        </Card>
      ))}

      {!disabled && (
        <Button onClick={handleAddNewRecord} variant="outline" className="w-full mt-4" disabled={disabled}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add New Criminal Record
        </Button>
      )}
      {disabled && records.length === 0 && (
        <p className="text-muted-foreground text-center">No criminal records provided.</p>
      )}
    </div>
  );
}
