// src/components/contribute/PoliticianForm.tsx
"use client"; 

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import PhotoUpload from '@/components/upload/PhotoUpload';
import { Loader2 } from 'lucide-react';

const LOCAL_STORAGE_KEY_NEW_POLITICIAN = 'newPoliticianFormDraft_v1';

// Zod Schema for validation
// Making sure the PoliticianFormData is comprehensive for a new submission
const politicianFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  name_nepali: z.string().optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be YYYY-MM-DD" }).optional().or(z.literal('')), // Optional but specific format if provided
  gender: z.enum(['Male', 'Female', 'Other', 'PreferNotToSay']).optional(),
  photo_asset_id: z.string().uuid({message: "Invalid photo asset ID format."}).optional().nullable(),
  
  // Detailed text fields, suggest JSON or structured text
  biography: z.string().optional(),
  education_details: z.string().optional(), // Could be JSON string: array of {degree, institution, year}
  political_journey: z.string().optional(), // Could be JSON string: array of {position, party, startDate, endDate}
  criminal_records: z.string().optional(), // Could be JSON string or "None"
  asset_declarations: z.string().optional(), // Could be JSON string: array of {year, description, value}

  // Contact and Social are nested objects
  contact_information: z.object({
    email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional().default({}), // Default to empty object
  
  social_media_handles: z.object({
    twitter: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')),
    facebook: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')),
    instagram: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')),
  }).optional().default({}), // Default to empty object
});

export type PoliticianFormData = z.infer<typeof politicianFormSchema>;

interface PoliticianFormProps {
  onSubmit: (data: PoliticianFormData) => void; // Changed from Promise<void> as submit happens in parent
  isLoading?: boolean;
  defaultValues?: Partial<PoliticianFormData>;
}

const PoliticianForm: React.FC<PoliticianFormProps> = ({ onSubmit, isLoading, defaultValues }) => {
  const [draftSaveStatus, setDraftSaveStatus] = useState<string>('');

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
      criminal_records: '',
      asset_declarations: '',
      contact_information: { email: '', phone: '', address: '' },
      social_media_handles: { twitter: '', facebook: '', instagram: '' },
      ...defaultValues, // Apply passed defaults over these
    },
  });

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY_NEW_POLITICIAN);
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        form.reset(draftData);
        setDraftSaveStatus("Draft loaded from last session.");
      } catch (error) {
        console.error("Error parsing saved draft:", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY_NEW_POLITICIAN);
      }
    }
  }, [form]);

  const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const watchedValues = useWatch({ control: form.control });

  const saveDraft = useCallback(debounce((data: PoliticianFormData) => {
    localStorage.setItem(LOCAL_STORAGE_KEY_NEW_POLITICIAN, JSON.stringify(data));
    setDraftSaveStatus(`Draft autosaved at ${new Date().toLocaleTimeString()}`);
  }, 1500), []); // Empty dependency array for useCallback

  useEffect(() => {
    if (form.formState.isDirty) {
      saveDraft(watchedValues as PoliticianFormData);
    }
  }, [watchedValues, saveDraft, form.formState.isDirty]);

  const handlePhotoUploaded = (assetId: string) => {
    form.setValue('photo_asset_id', assetId, { shouldValidate: true, shouldDirty: true });
  };

  const handleFormSubmitWrapper = (data: PoliticianFormData) => {
    onSubmit(data); // This now passes data to parent for preview
    // Draft clearing will happen in parent after successful final submission
  };
  
  const clearDraftManually = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY_NEW_POLITICIAN);
    form.reset({ // Reset to initial empty/default state
      name: '', name_nepali: '', dob: '', gender: undefined, photo_asset_id: null,
      biography: '', education_details: '', political_journey: '', criminal_records: '', asset_declarations: '',
      contact_information: { email: '', phone: '', address: '' },
      social_media_handles: { twitter: '', facebook: '', instagram: '' },
      ...defaultValues,
    });
    setDraftSaveStatus("Draft cleared manually.");
  };

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
                 <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || undefined}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="PreferNotToSay">Prefer not to say</SelectItem>
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
                />
              </FormControl>
              {field.value && <FormDescription className="mt-2">Photo uploaded. Asset ID: {field.value}</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        
        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Biography</h2>
        <FormField control={form.control} name="biography" render={({ field }) => (
            <FormItem>
              <FormLabel>Detailed Biography</FormLabel>
              <FormControl><Textarea placeholder="Enter detailed biography..." {...field} rows={5} /></FormControl>
              <FormDescription>Share key information about the politician's background and career. Use Markdown for formatting.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Additional Details</h2>
        <div className="space-y-6">
          <FormField control={form.control} name="education_details" render={({ field }) => (
              <FormItem>
                <FormLabel>Education Details</FormLabel>
                <FormControl><Textarea placeholder="Example:\n- Masters in Political Science, XYZ University (2010)\n- Bachelor of Arts, ABC College (2007)" {...field} rows={3} /></FormControl>
                <FormDescription>Use Markdown for formatting. List degrees, institutions, and years.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="political_journey" render={({ field }) => (
              <FormItem>
                <FormLabel>Political Journey</FormLabel>
                <FormControl><Textarea placeholder="Example:\n- Ward Member, ABC Party (2060-01-01 - 2064-12-30)\n  - Focused on local infrastructure projects." {...field} rows={4} /></FormControl>
                <FormDescription>Use Markdown for formatting. Detail roles, parties, and timelines.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="criminal_records" render={({ field }) => (
              <FormItem>
                <FormLabel>Criminal Records (if any)</FormLabel>
                <FormControl><Textarea placeholder='Example:\n- Case: Alleged Irregularity (2070)\n  Status: Pending Investigation\nOr simply type "None".' {...field} rows={3} /></FormControl>
                <FormDescription>Use Markdown for formatting. Describe any cases and their status, or state "None".</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="asset_declarations" render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Declarations</FormLabel>
                <FormControl><Textarea placeholder="Example:\n**Year 2078**\n- House in KTM, Value: 1 Crore NRs\n- Land in Pokhara, Value: 50 Lakhs NRs" {...field} rows={4} /></FormControl>
                <FormDescription>Use Markdown for formatting. List assets, their value, and relevant years.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
          <Controller
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
          {isLoading ? 'Processing...' : 'Preview Contribution'}
        </Button>
      </form>
    </Form>
  );
};

export default PoliticianForm;
