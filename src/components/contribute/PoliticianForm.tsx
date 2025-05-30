
// src/components/contribute/PoliticianForm.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import PhotoUpload from '@/components/upload/PhotoUpload';
import { Loader2 } from 'lucide-react';
import { CriminalRecordEditor, type CriminalRecord } from '@/components/wiki/CriminalRecordEditor';
import { AssetDeclarationEditor, type AssetDeclaration } from '@/components/wiki/AssetDeclarationEditor';

const LOCAL_STORAGE_KEY_NEW_POLITICIAN_CREATE = 'newPoliticianFormDraft_create_v3';
const LOCAL_STORAGE_KEY_NEW_POLITICIAN_EDIT_PREFIX = 'newPoliticianFormDraft_edit_v3_';


const criminalRecordSchema = z.object({
  id: z.string().uuid(),
  case_description: z.string().min(1, "Case description is required."),
  offense_date: z.string().optional().or(z.literal('')),
  court_name: z.string().optional(),
  case_status: z.enum(['Pending', 'Convicted', 'Acquitted', 'Discharged', '']).optional(),
  sentence_details: z.string().optional(),
  relevant_laws: z.string().optional(),
});

const assetDeclarationSchema = z.object({
  id: z.string().uuid(),
  year: z.union([z.number(), z.string()]).pipe(z.coerce.number().int().min(1900).max(new Date().getFullYear() + 5)),
  description_of_assets: z.string().min(1, "Description is required."),
  source_of_income: z.string().optional(),
});


const politicianFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  name_nepali: z.string().optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be YYYY-MM-DD" }).optional().or(z.literal('')),
  gender: z.enum(['Male', 'Female', 'Other', 'PreferNotToSay', '']).optional(),
  photo_asset_id: z.string().uuid({message: "Invalid photo asset ID format."}).optional().nullable(),

  biography: z.string().optional(),
  // Use string for Markdown input, parsing/validation happens elsewhere or on display
  education_details: z.string().optional(), 
  political_journey: z.string().optional(),

  criminal_records: z.array(criminalRecordSchema).optional().default([]),
  asset_declarations: z.array(assetDeclarationSchema).optional().default([]),

  contact_information: z.object({
    email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional().default({ email: '', phone: '', address: '' }),

  social_media_handles: z.object({
    twitter: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')),
    facebook: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')),
    instagram: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')),
  }).optional().default({ twitter: '', facebook: '', instagram: '' }),
});

export type PoliticianFormData = z.infer<typeof politicianFormSchema>;

interface PoliticianFormProps {
  onSubmit: (data: PoliticianFormData) => void; // This callback triggers the preview step
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  politicianId?: string; // Required if mode is 'edit'
  initialData?: Partial<PoliticianFormData>; // For pre-filling in 'edit' mode
}

const GENDER_NOT_SPECIFIED_SENTINEL = "__NOT_SPECIFIED_GENDER__";
const GENDER_OPTIONS: Array<{ value: PoliticianFormData['gender'] | typeof GENDER_NOT_SPECIFIED_SENTINEL, label: string }> = [
    { value: GENDER_NOT_SPECIFIED_SENTINEL, label: "(Not Specified)" },
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
    { value: "PreferNotToSay", label: "Prefer not to say" },
];

const PoliticianForm: React.FC<PoliticianFormProps> = ({
  onSubmit,
  isLoading,
  mode = 'create',
  politicianId,
  initialData,
}) => {
  const [draftSaveStatus, setDraftSaveStatus] = useState<string>('');
  const localStorageKey = mode === 'create'
    ? LOCAL_STORAGE_KEY_NEW_POLITICIAN_CREATE
    : `${LOCAL_STORAGE_KEY_NEW_POLITICIAN_EDIT_PREFIX}${politicianId || ''}`;

  const form = useForm<PoliticianFormData>({
    resolver: zodResolver(politicianFormSchema),
    defaultValues: {
      name: '',
      name_nepali: '',
      dob: '',
      gender: undefined,
      photo_asset_id: null,
      biography: '',
      education_details: '',
      political_journey: '',
      criminal_records: [],
      asset_declarations: [],
      contact_information: { email: '', phone: '', address: '' },
      social_media_handles: { twitter: '', facebook: '', instagram: '' },
      ...(mode === 'edit' && initialData ? initialData : {}),
    },
  });

  useEffect(() => {
    // Pre-fill form if in edit mode and initialData is provided
    if (mode === 'edit' && initialData) {
      form.reset(initialData);
    }
  }, [mode, initialData, form]);

  useEffect(() => {
    if (mode === 'create' || (mode === 'edit' && politicianId)) { // Only load draft if relevant
      const savedDraft = localStorage.getItem(localStorageKey);
      if (savedDraft && (!initialData || form.formState.isDirty)) { // Don't overwrite pristine initialData with old draft
        try {
          const draftData = JSON.parse(savedDraft);
          draftData.criminal_records = draftData.criminal_records || [];
          draftData.asset_declarations = draftData.asset_declarations || [];
          form.reset(draftData);
          setDraftSaveStatus("Draft loaded from last session.");
        } catch (error) {
          console.error("Error parsing saved draft:", error);
          localStorage.removeItem(localStorageKey);
        }
      }
    }
  }, [form, localStorageKey, mode, politicianId, initialData]);

  const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const watchedValues = useWatch({ control: form.control });

  const saveDraft = useCallback(debounce((data: PoliticianFormData) => {
    if (mode === 'create' || (mode === 'edit' && politicianId)) {
      localStorage.setItem(localStorageKey, JSON.stringify(data));
      setDraftSaveStatus(`Draft autosaved at ${new Date().toLocaleTimeString()}`);
    }
  }, 1500), [localStorageKey, mode, politicianId]);

  useEffect(() => {
    if (form.formState.isDirty) {
      saveDraft(watchedValues as PoliticianFormData);
    }
  }, [watchedValues, saveDraft, form.formState.isDirty]);

  const handlePhotoUploaded = (assetId: string) => {
    form.setValue('photo_asset_id', assetId, { shouldValidate: true, shouldDirty: true });
  };

  const handleFormSubmitWrapper = (data: PoliticianFormData) => {
    onSubmit(data); // This now just calls the prop to show preview
  };

  const clearDraftManually = () => {
    localStorage.removeItem(localStorageKey);
    form.reset({
      name: '', name_nepali: '', dob: '', gender: undefined, photo_asset_id: null,
      biography: '', education_details: '', political_journey: '',
      criminal_records: [], asset_declarations: [],
      contact_information: { email: '', phone: '', address: '' },
      social_media_handles: { twitter: '', facebook: '', instagram: '' },
      ...(mode === 'edit' && initialData ? initialData : {}),
    });
    setDraftSaveStatus("Draft cleared manually.");
  };

  const submitButtonText = mode === 'create' ? 'Preview Contribution' : 'Preview Edits';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmitWrapper)} className="space-y-8">
        {draftSaveStatus && (
          <div className="text-sm text-gray-500 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-800 rounded-md flex justify-between items-center">
            <span>{draftSaveStatus}</span>
            <Button type="button" variant="ghost" size="sm" onClick={clearDraftManually} className="text-xs">Clear Draft</Button>
          </div>
        )}

        <h2 className="text-xl font-semibold border-b pb-2">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name (English) *</FormLabel>
                <FormControl><Input placeholder="Full Name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="name_nepali" render={({ field }) => (
              <FormItem>
                <FormLabel>Name (Nepali)</FormLabel>
                <FormControl><Input placeholder="पूरा नाम" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="dob" render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth (YYYY-MM-DD)</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormDescription>AD Format. Example: 1980-05-15</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                 <Select
                    onValueChange={(value) => field.onChange(value === GENDER_NOT_SPECIFIED_SENTINEL ? '' : value)}
                    value={field.value === '' || field.value === undefined ? GENDER_NOT_SPECIFIED_SENTINEL : field.value}
                 >
                  <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {GENDER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value as string}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Photo</h2>
        <FormField control={form.control} name="photo_asset_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Politician's Photo</FormLabel>
              <FormControl>
                <PhotoUpload
                  onUploadComplete={handlePhotoUploaded}
                  assetType="politician_photo"
                  aspectRatio={1}
                  initialPreviewUrl={
                    mode === 'edit' && typeof field.value === 'string' ? field.value : undefined
                  }
                />
              </FormControl>
              {field.value && <FormDescription className="mt-2">Photo asset ID: {field.value}</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />

        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Biography</h2>
        <FormField control={form.control} name="biography" render={({ field }) => (
            <FormItem>
              <FormLabel>Detailed Biography</FormLabel>
              <FormControl><Textarea placeholder="Share key events, background, and career highlights using Markdown for formatting." {...field} rows={5} /></FormControl>
              <FormDescription>Use Markdown for formatting (e.g., **bold**, *italics*, lists). Share key information about the politician's background and career.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Education & Political Journey</h2>
        <div className="space-y-6">
          <FormField control={form.control} name="education_details" render={({ field }) => (
              <FormItem>
                <FormLabel>Education Details</FormLabel>
                <FormControl><Textarea placeholder="Example using Markdown:\n- **Masters in Political Science** - XYZ University (2010)\n- *Bachelor of Arts* - ABC College (2007)" {...field} rows={3} /></FormControl>
                <FormDescription>Use Markdown for formatting. List degrees, institutions, and years.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="political_journey" render={({ field }) => (
              <FormItem>
                <FormLabel>Political Journey</FormLabel>
                <FormControl><Textarea placeholder="Example using Markdown:\n- **Ward Member**, ABC Party (2060-01-01 - 2064-12-30)\n  - Focused on local infrastructure projects.\n- *Central Committee Member*, XYZ Party (2070-Present)" {...field} rows={4} /></FormControl>
                <FormDescription>Use Markdown for formatting. Detail roles, parties, timelines, and key responsibilities or achievements.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Criminal Records (if any)</h2>
        <FormField
            control={form.control}
            name="criminal_records"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Manage Criminal Records</FormLabel>
                    <FormControl>
                        <CriminalRecordEditor
                            id="criminal-records-form-editor"
                            value={field.value || []}
                            onChange={(newRecords) => field.onChange(newRecords)}
                            disabled={isLoading}
                        />
                    </FormControl>
                    <FormDescription>Add, edit, or remove criminal records. Provide accurate and verifiable information.</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />

        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Asset Declarations</h2>
         <FormField
            control={form.control}
            name="asset_declarations"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Manage Asset Declarations</FormLabel>
                    <FormControl>
                        <AssetDeclarationEditor
                            id="asset-declarations-form-editor"
                            value={field.value || []}
                            onChange={(newDeclarations) => field.onChange(newDeclarations)}
                            disabled={isLoading}
                        />
                    </FormControl>
                    <FormDescription>Add, edit, or remove yearly asset declarations.</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />


        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="contact_information.email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl><Input type="email" placeholder="contact@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="contact_information.phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl><Input placeholder="+977-..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_information.address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Full Address</FormLabel>
                <FormControl><Input placeholder="Current residential or office address" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Social Media</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="social_media_handles.twitter" render={({ field }) => (
              <FormItem>
                <FormLabel>Twitter Profile URL</FormLabel>
                <FormControl><Input type="url" placeholder="https://twitter.com/username" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="social_media_handles.facebook" render={({ field }) => (
              <FormItem>
                <FormLabel>Facebook Profile URL</FormLabel>
                <FormControl><Input type="url" placeholder="https://facebook.com/username" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField control={form.control} name="social_media_handles.instagram" render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram Profile URL</FormLabel>
                <FormControl><Input type="url" placeholder="https://instagram.com/username" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading || !form.formState.isDirty || !!Object.keys(form.formState.errors).length} className="mt-8 w-full md:w-auto">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Processing...' : submitButtonText}
        </Button>
      </form>
    </Form>
  );
};

export default PoliticianForm;
    
