
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
  updatePoliticianDirectly,
  DirectUpdateReturnType
} from '@/lib/actions/politician.actions';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // For better select UI


// Props that custom editors will receive
export interface EditorProps<T = string | number | any[] | Record<string, any>> {
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  maxLength?: number;
  options?: Array<{ label: string; value: string } | string> | undefined; // Updated type
  // Allow any other props for custom editors
  [key: string]: any;
}

export type FieldType = 'text' | 'textarea' | 'date' | 'richtext' | 'number' | 'url' | 'select' | 'custom';

export interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  politicianId: string;
  fieldName: string;
  currentValue: any;
  fieldType?: FieldType;
  fieldLabel?: string;
  fieldOptions?: Array<{ label: string; value: string } | string> | undefined; // Updated type
  editorComponent?: React.ComponentType<EditorProps<any>>;
  editorProps?: Record<string, any>;
  isAdmin?: boolean;
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
  editorComponent: CustomEditor,
  editorProps,
  isAdmin = false,
}: EditModalProps) {
  const [newValue, setNewValue] = useState(currentValue);
  const [changeReason, setChangeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setNewValue(currentValue);
    setChangeReason('');
    setIsSubmitting(false);
  }, [currentValue, isOpen, fieldName]);

  const handleValueChange = (value: any) => {
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

    const isComplexType = typeof currentValue === 'object' && currentValue !== null;
    const valueChanged = isComplexType
      ? JSON.stringify(newValue) !== JSON.stringify(currentValue)
      : newValue !== currentValue;

    if (!valueChanged) {
      toast({ title: "No Changes Made", description: "The value is the same as the current one.", variant: "info" });
      return;
    }

    if (!isAdmin && !changeReason.trim()) {
      toast({ title: "Change Reason Required", description: "Please provide a reason for your edit.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    let result: SubmitEditReturnType | DirectUpdateReturnType;

    if (isAdmin) {
      result = await updatePoliticianDirectly(
        politicianId,
        fieldName,
        newValue,
        user.id,
        changeReason.trim()
      );
    } else {
      result = await submitPoliticianEdit(
        politicianId,
        fieldName,
        newValue,
        changeReason,
        user.id
      );
    }

    setIsSubmitting(false);
    if (result.success) {
      toast({
        title: isAdmin ? "Admin Edit Successful" : "Edit Submitted",
        description: result.message || (isAdmin ? `Field "${fieldName}" updated directly.` : "Your edit proposal has been submitted for review."),
        variant: "success"
      });
      onClose();
    } else {
      toast({
        title: isAdmin ? "Admin Edit Failed" : "Submission Failed",
        description: result.message || result.error || "Could not apply changes.",
        variant: "destructive"
      });
    }
  };

  const isValueChanged = typeof currentValue === 'object' && currentValue !== null
    ? JSON.stringify(newValue) !== JSON.stringify(currentValue)
    : newValue !== currentValue;

  const canSubmit =
    isValueChanged &&
    (isAdmin || changeReason.trim() !== '') &&
    !isSubmitting;

  const displayLabel = fieldLabel || fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' ');

  if (!isOpen) {
    return null;
  }

  const editorCommonProps: EditorProps<any> = {
    value: newValue,
    onChange: handleValueChange,
    disabled: isSubmitting,
    id: `edit-${fieldName}`,
    placeholder: `Enter ${displayLabel.toLowerCase()}...`,
    options: fieldOptions,
    ...(editorProps || {}),
  };

  const renderEditor = () => {
    if (fieldType === 'custom' && CustomEditor) {
      return <CustomEditor {...editorCommonProps} />;
    }

    switch (fieldType) {
      case 'richtext':
        return <RichTextEditor {...editorCommonProps} value={String(newValue ?? '')} />;
      case 'textarea':
        return (
          <Textarea
            {...editorCommonProps}
            value={String(newValue ?? '')}
            onChange={(e) => handleValueChange(e.target.value)}
            className="min-h-[100px]"
          />
        );
      case 'number':
        return (
          <Input
            {...editorCommonProps}
            type="number"
            value={newValue as number}
            onChange={(e) => handleValueChange(e.target.valueAsNumber ?? parseFloat(e.target.value))}
          />
        );
      case 'url':
        return (
          <Input
            {...editorCommonProps}
            type="url"
            value={String(newValue ?? '')}
            onChange={(e) => handleValueChange(e.target.value)}
          />
        );
      case 'select':
        return (
          <Select
            onValueChange={(val) => handleValueChange(val)}
            defaultValue={String(newValue ?? '')} // DefaultValue needs to be a string
            disabled={editorCommonProps.disabled}
          >
            <SelectTrigger id={editorCommonProps.id} className={cn("w-full", editorCommonProps.className)}>
              <SelectValue placeholder={editorCommonProps.placeholder || `Select ${displayLabel}`} />
            </SelectTrigger>
            <SelectContent>
              {editorCommonProps.options?.map((opt, index) => {
                if (typeof opt === 'object' && opt !== null && 'value' in opt && 'label' in opt) {
                  // Ensure opt.value is a string for SelectItem value prop
                  return <SelectItem key={String(opt.value) + '-' + index} value={String(opt.value)}>{opt.label}</SelectItem>;
                } else if (typeof opt === 'string') {
                  return <SelectItem key={opt + '-' + index} value={opt}>{opt}</SelectItem>;
                }
                return null; // Should not happen with well-formed options
              })}
            </SelectContent>
          </Select>
        );
      case 'text':
      default:
        return (
          <Input
            {...editorCommonProps}
            type="text"
            value={String(newValue ?? '')}
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
            Current value: <span className="font-mono text-xs bg-muted p-1 rounded">{String(currentValue ?? 'Not set')}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor={`edit-${fieldName}`} className="text-right pt-2 col-span-1">
              New Value
            </Label>
            <div className="col-span-3">
              {renderEditor()}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="changeReason" className="text-right pt-2 col-span-1">
              Reason {isAdmin ? '(Optional)' : <span className="text-destructive">*</span>}
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
              required={!isAdmin}
            />
          </div>

          {isValueChanged && (
            <div className="mt-4 p-3 bg-muted/40 rounded-md text-sm col-span-4">
              <h4 className="font-semibold mb-1">Preview of Change:</h4>
                <p>
                  <span className="font-medium text-muted-foreground line-through">{String(currentValue ?? 'N/A')}</span>
                  <span className="mx-1 text-muted-foreground">→</span>
                  <span className="text-green-600 font-semibold">{String(newValue ?? 'N/A')}</span>
                </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? 'Submitting...' : (isAdmin ? 'Save Directly' : 'Submit Edit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    