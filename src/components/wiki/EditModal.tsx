import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RichTextEditor } from './RichTextEditor';
import { 
  submitPoliticianEdit, 
  SubmitEditReturnType,
  updatePoliticianDirectly, // Import the new action
  DirectUpdateReturnType 
} from '@/lib/actions/politician.actions';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';


// Props that custom editors will receive
export interface EditorProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  // Add other common props that editors might need, e.g., maxLength for text inputs
  maxLength?: number; 
  // For select type or similar
  options?: string[];
}

export type FieldType = 'text' | 'textarea' | 'date' | 'richtext' | 'number' | 'url' | 'select' | 'custom'; // Added 'custom'

export interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  politicianId: string;
  fieldName: string;
  currentValue: string | number;
  fieldType?: FieldType;
  fieldLabel?: string;
  fieldOptions?: string[]; // For 'select' type
  editorComponent?: React.ComponentType<EditorProps<any>>; // Allow any value type for custom editor for now
  editorProps?: Record<string, any>; // For passing additional props like isBSDate to editors
  isAdmin?: boolean; // Added isAdmin prop
}

export function EditModal({
  isOpen,
  onClose,
  politicianId,
  fieldName,
  currentValue,
  fieldType = 'text',
  fieldLabel,
  fieldOptions,
  editorComponent: CustomEditor, // Renamed for clarity
  editorProps,
  isAdmin = false, // Default isAdmin to false
}: EditModalProps) {
  const [newValue, setNewValue] = useState(currentValue);
  const [changeReason, setChangeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth(); // Get user from auth context
  const { toast } = useToast(); // For showing notifications

  useEffect(() => {
    // Reset form when currentValue changes or modal opens
    setNewValue(currentValue);
    setChangeReason('');
    // Reset isSubmitting when modal is reopened or form changes
    setIsSubmitting(false);
  }, [currentValue, isOpen]);

  const handleValueChange = (value: string | number) => {
    setNewValue(value);
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChangeReason(e.target.value);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to submit an edit.", variant: "destructive" });
      return;
    }

    const valueChanged = newValue !== currentValue;
    if (!valueChanged) {
      toast({ title: "No Changes Made", description: "The value is the same as the current one.", variant: "info" });
      return;
    }

    if (!isAdmin && !changeReason.trim()) {
      toast({ title: "Change Reason Required", description: "Please provide a reason for your edit.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);

    if (isAdmin) {
      try {
        const result: DirectUpdateReturnType = await updatePoliticianDirectly(
          politicianId,
          fieldName,
          newValue,
          user.id, // adminId
          changeReason.trim() // Optional reason for admin
        );

        if (result.success) {
          toast({ 
            title: "Admin Edit Successful", 
            description: result.message || `Field "${fieldName}" updated directly.`, 
            variant: "success" 
          });
          onClose();
        } else {
          console.error('Admin direct update failed:', result.error);
          toast({ 
            title: "Admin Edit Failed", 
            description: result.message || result.error || "Could not apply changes directly.", 
            variant: "destructive" 
          });
        }
      } catch (error: any) {
        console.error('Unexpected error during admin direct update:', error);
        toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Non-admin: submit for review
      try {
        const result: SubmitEditReturnType = await submitPoliticianEdit(
          politicianId,
          fieldName,
          newValue,
          changeReason, // Already checked for non-admin
          user.id
        );

        if (result.success) {
          toast({ title: "Edit Submitted", description: result.message || "Your edit proposal has been submitted for review.", variant: "success" });
          onClose();
        } else {
          console.error('Submission failed:', result.error);
          toast({ title: "Submission Failed", description: result.message || "An error occurred.", variant: "destructive" });
        }
      } catch (error: any) {
        console.error('Unexpected error during submission:', error);
        toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isValueChanged = newValue !== currentValue;
  // Adjust canSubmit logic for admin
  const canSubmit = 
    isValueChanged && 
    (isAdmin || changeReason.trim() !== '') && 
    !isSubmitting;
    
  const displayLabel = fieldLabel || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

  if (!isOpen) {
    return null;
  }

  const editorCommonProps: EditorProps<any> = {
    value: newValue,
    onChange: handleValueChange,
    disabled: isSubmitting,
    id: "fieldValue",
    placeholder: `Enter ${displayLabel.toLowerCase()}...`,
    options: fieldOptions, // Pass options for select type
    ...editorProps, // Spread additional editor-specific props like isBSDate
  };

  const renderEditor = () => {
    if (fieldType === 'custom' && CustomEditor) {
      // For custom editors, pass editorProps which might contain specific configurations they need
      return <CustomEditor {...editorCommonProps} {...(editorProps || {})} />;
    }

    switch (fieldType) {
      case 'richtext':
        return <RichTextEditor {...editorCommonProps} value={String(newValue)} />; // Ensure RichTextEditor takes string
      case 'textarea':
        return (
          <Textarea
            {...editorCommonProps}
            value={String(newValue)} // Ensure Textarea takes string
            onChange={(e) => handleValueChange(e.target.value)}
            className="min-h-[100px]"
          />
        );
      case 'number':
        return (
          <Input
            {...editorCommonProps}
            type="number"
            value={newValue as number} // Assuming newValue is number for this type
            onChange={(e) => handleValueChange(e.target.valueAsNumber ?? parseFloat(e.target.value))}
          />
        );
      case 'url':
        return (
          <Input
            {...editorCommonProps}
            type="url"
            value={String(newValue)} // Ensure Input takes string
            onChange={(e) => handleValueChange(e.target.value)}
          />
        );
      // case 'date': // Assuming DateEditor is used via 'custom' or specific logic
      //   return <DateEditor {...editorCommonProps} isBSDate={editorProps?.isBSDate} value={String(newValue)} />;
      case 'select':
         // A basic select example if not using a custom component
         // This would ideally be its own component for better reusability and UI.
        return (
          <select
            id={editorCommonProps.id}
            value={String(newValue)}
            onChange={(e) => handleValueChange(e.target.value)}
            disabled={editorCommonProps.disabled}
            className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", editorCommonProps.className)}
          >
            <option value="" disabled>{editorCommonProps.placeholder || `Select ${displayLabel}`}</option>
            {editorCommonProps.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'text':
      default:
        return (
          <Input
            {...editorCommonProps}
            type="text"
            value={String(newValue)} // Ensure Input takes string
            onChange={(e) => handleValueChange(e.target.value)}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit {displayLabel}</DialogTitle>
          <DialogDescription>
            Make changes to the field: "{displayLabel}". Please provide a reason for your edit.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-4 items-start gap-4"> {/* Changed items-center to items-start for better alignment with taller editors */}
            <Label htmlFor="fieldValue" className="text-right pt-2"> {/* Added pt-2 for alignment */}
              {displayLabel}
            </Label>
            <div className="col-span-3">
              {renderEditor()}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4"> {/* Changed items-center to items-start */}
            <Label htmlFor="changeReason" className="text-right pt-2 self-start">
              Change Reason {isAdmin ? '(Optional)' : <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="changeReason"
              value={changeReason}
              onChange={handleReasonChange}
              placeholder={
                isAdmin 
                  ? "Optional: Explain why you are making this change as an admin."
                  : "Explain why you are making this change (required)"
              }
              className="col-span-3 min-h-[100px]"
              required={!isAdmin} // HTML5 required attribute
            />
          </div>

          {isValueChanged && (
            <div className="mt-4 p-4 bg-muted/40 rounded-md">
              <h4 className="font-semibold mb-2">Preview of Changes:</h4>
              <div className="text-sm">
                <p>
                  <span className="font-medium">{displayLabel}:</span>
                  <span className="ml-1 line-through text-muted-foreground">{String(currentValue)}</span>
                  <span className="ml-2 text-green-600 font-semibold">{String(newValue)}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-auto pt-4 border-t"> {/* Added border for separation */}
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? 'Submitting...' : 'Submit Edit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
