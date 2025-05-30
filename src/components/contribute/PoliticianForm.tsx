// src/components/contribute/PoliticianForm.tsx
"use client"; // Required for Next.js App Router client components

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Not used in final example, Select is used
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import PhotoUpload from '@/components/upload/PhotoUpload'; // Adjust path as needed

// Zod Schema for validation
const politicianFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  name_nepali: z.string().optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be YYYY-MM-DD" }),
  gender: z.enum(['Male', 'Female', 'Other', 'PreferNotToSay']),
  photo_asset_id: z.string().optional().nullable(),
  biography: z.string().optional(),
  education_details: z.string().optional(), 
  political_journey: z.string().optional(),
  criminal_records: z.string().optional(),
  asset_declarations: z.string().optional(),
  contact_information: z.object({
    email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  social_media_handles: z.object({
    twitter: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')),
    facebook: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')),
    instagram: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')),
  }).optional(),
});

export type PoliticianFormData = z.infer<typeof politicianFormSchema>;

interface PoliticianFormProps {
  onSubmit: (data: PoliticianFormData) => void;
  isLoading?: boolean;
  defaultValues?: Partial<PoliticianFormData>;
}

const PoliticianForm: React.FC<PoliticianFormProps> = ({ onSubmit, isLoading, defaultValues }) => {
  const form = useForm<PoliticianFormData>({
    resolver: zodResolver(politicianFormSchema),
    defaultValues: {
      ...defaultValues,
      contact_information: defaultValues?.contact_information || { email: '', phone: '', address: '' },
      social_media_handles: defaultValues?.social_media_handles || { twitter: '', facebook: '', instagram: '' },
    },
  });

  const handlePhotoUploaded = (assetId: string) => {
    form.setValue('photo_asset_id', assetId, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info Section */}
        <h2 className="text-xl font-semibold border-b pb-2">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (English) *</FormLabel>
                <FormControl><Input placeholder="Full Name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name_nepali"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (Nepali)</FormLabel>
                <FormControl><Input placeholder="पूरा नाम" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth (BS, YYYY-MM-DD) *</FormLabel>
                <FormControl><Input placeholder="e.g., 2050-01-15" {...field} /></FormControl>
                <FormDescription>Bikram Sambat format.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        {/* Photo Upload */}
        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Photo</h2>
        <FormField
          control={form.control}
          name="photo_asset_id"
          render={({ field }) => ( 
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
        />
        
        {/* Biography */}
        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Biography</h2>
        <FormField
          control={form.control}
          name="biography"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detailed Biography</FormLabel>
              <FormControl><Textarea placeholder="Enter detailed biography..." {...field} rows={5} /></FormControl>
              <FormDescription>Supports plain text. Future enhancements could include rich text (Markdown).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Other Details Section */}
        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Additional Details</h2>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="education_details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Education Details</FormLabel>
                <FormControl><Textarea placeholder='e.g., [{"degree": "Masters", "institution": "XYZ University", "year": 2010}]' {...field} rows={3} /></FormControl>
                <FormDescription>Enter as a JSON array or structured text (e.g., each qualification on a new line).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="political_journey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Political Journey</FormLabel>
                <FormControl><Textarea placeholder='e.g., [{"position": "Ward Member", "party": "ABC Party", "startDate": "2060-01-01"}]' {...field} rows={4} /></FormControl>
                <FormDescription>Enter as a JSON array or structured text detailing roles, parties, and timelines.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="criminal_records"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Criminal Records (if any)</FormLabel>
                <FormControl><Textarea placeholder='e.g., [{"case": "Corruption Case", "status": "Pending"}] or "None"' {...field} rows={3} /></FormControl>
                <FormDescription>Enter as a JSON array, structured text, or simply "None" if not applicable.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="asset_declarations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Declarations</FormLabel>
                <FormControl><Textarea placeholder='e.g., [{"year": 2078, "description": "House in KTM", "value": "1 Crore NRs"}]' {...field} rows={4} /></FormControl>
                <FormDescription>Enter as a JSON array or structured text, typically declared periodically.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Information */}
        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="contact_information.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl><Input type="email" placeholder="contact@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_information.phone"
            render={({ field }) => (
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

        {/* Social Media Handles */}
        <h2 className="text-xl font-semibold border-b pb-2 mt-6">Social Media</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="social_media_handles.twitter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Twitter Profile URL</FormLabel>
                <FormControl><Input type="url" placeholder="https://twitter.com/username" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="social_media_handles.facebook"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facebook Profile URL</FormLabel>
                <FormControl><Input type="url" placeholder="https://facebook.com/username" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="social_media_handles.instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram Profile URL</FormLabel>
                <FormControl><Input type="url" placeholder="https://instagram.com/username" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button type="submit" disabled={isLoading} className="mt-8">
          {isLoading ? 'Submitting...' : 'Submit Politician Data'}
        </Button>
      </form>
    </Form>
  );
};

export default PoliticianForm;
