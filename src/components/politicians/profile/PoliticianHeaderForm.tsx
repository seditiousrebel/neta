
// src/components/politicians/profile/PoliticianHeaderForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const GENDER_NOT_SPECIFIED_SENTINEL = "__NOT_SPECIFIED_GENDER__";
const GENDER_OPTIONS: Array<{ value: string, label: string }> = [
    { value: GENDER_NOT_SPECIFIED_SENTINEL, label: "(Not Specified)" },
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
    { value: "PreferNotToSay", label: "Prefer not to say" },
];

const politicianHeaderFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  name_nepali: z.string().optional().nullable(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be YYYY-MM-DD" }).optional().or(z.literal('')).nullable(),
  dob_bs: z.string().optional().nullable(),
  gender: z.enum(['Male', 'Female', 'Other', 'PreferNotToSay', '']).optional().nullable(),
  contact_email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')).nullable(),
  contact_phone: z.string().optional().nullable(),
  permanent_address: z.string().optional().nullable(),
  current_address: z.string().optional().nullable(),
  twitter_handle: z.string().refine(val => !val || !val.startsWith('https://') && !val.startsWith('@'), {
    message: "Enter Twitter handle only (e.g., username), not the full URL or @ symbol.",
  }).optional().nullable(),
  facebook_profile_url: z.string().url({ message: "Invalid Facebook URL." }).optional().or(z.literal('')).nullable(),
  changeReason: z.string().optional(), // Added for non-admins
});

export type PoliticianHeaderFormData = Omit<z.infer<typeof politicianHeaderFormSchema>, 'changeReason'>;
type FormValuesWithReason = z.infer<typeof politicianHeaderFormSchema>;


interface PoliticianHeaderFormProps {
  initialData?: PoliticianHeaderFormData;
  onSubmit: (data: PoliticianHeaderFormData, changeReason?: string) => Promise<void>;
  isLoading?: boolean;
  isAdmin: boolean;
}

const PoliticianHeaderForm: React.FC<PoliticianHeaderFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
  isAdmin,
}) => {
  const form = useForm<FormValuesWithReason>({
    resolver: zodResolver(politicianHeaderFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      name_nepali: initialData?.name_nepali || '',
      dob: initialData?.dob || '',
      dob_bs: initialData?.dob_bs || '',
      gender: initialData?.gender || '',
      contact_email: initialData?.contact_email || '',
      contact_phone: initialData?.contact_phone || '',
      permanent_address: initialData?.permanent_address || '',
      current_address: initialData?.current_address || '',
      twitter_handle: initialData?.twitter_handle || '',
      facebook_profile_url: initialData?.facebook_profile_url || '',
      changeReason: '',
    },
  });

  const handleFormSubmit = async (data: FormValuesWithReason) => {
    const { changeReason, ...headerData } = data;
    // Nullify empty strings before submission if schema implies they should be null
    const processedData = Object.fromEntries(
      Object.entries(headerData).map(([key, value]) => [key, value === '' ? null : value])
    ) as PoliticianHeaderFormData;
    await onSubmit(processedData, changeReason);
  };
  
  // Check if any value has changed from initialData
  const watchedValues = form.watch();
  const isChanged = React.useMemo(() => {
    if (!initialData) return true; // If no initial data, any input is a change
    return Object.keys(initialData).some(key => {
      const formKey = key as keyof PoliticianHeaderFormData;
      return String(initialData[formKey] ?? '') !== String(watchedValues[formKey] ?? '');
    });
  }, [initialData, watchedValues]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Name (English) *</FormLabel>
              <FormControl><Input placeholder="Full Name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="name_nepali" render={({ field }) => (
            <FormItem>
              <FormLabel>Name (Nepali)</FormLabel>
              <FormControl><Input placeholder="पूरा नाम" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="dob" render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth (AD)</FormLabel>
              <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="dob_bs" render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth (BS)</FormLabel>
              <FormControl><Input placeholder="e.g., 2037-02-15" {...field} value={field.value ?? ''} /></FormControl>
              <FormDescription>YYYY-MM-DD format recommended.</FormDescription>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="gender" render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === GENDER_NOT_SPECIFIED_SENTINEL ? '' : value)}
                value={field.value === '' || field.value === null || field.value === undefined ? GENDER_NOT_SPECIFIED_SENTINEL : field.value}
              >
                <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                <SelectContent>
                  {GENDER_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}/>
        </div>

        <h3 className="text-md font-semibold border-b pb-1 pt-2">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="contact_email" render={({ field }) => (
                <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl><Input type="email" placeholder="contact@example.com" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="contact_phone" render={({ field }) => (
                <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl><Input placeholder="+977-..." {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="permanent_address" render={({ field }) => (
                <FormItem className="md:col-span-2">
                <FormLabel>Permanent Address</FormLabel>
                <FormControl><Input placeholder="Permanent address details" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="current_address" render={({ field }) => (
                <FormItem className="md:col-span-2">
                <FormLabel>Current Address</FormLabel>
                <FormControl><Input placeholder="Current address details" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
                </FormItem>
            )}/>
        </div>

        <h3 className="text-md font-semibold border-b pb-1 pt-2">Social Media</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="twitter_handle" render={({ field }) => (
                <FormItem>
                <FormLabel>Twitter Handle</FormLabel>
                <FormControl><Input placeholder="username (without @)" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="facebook_profile_url" render={({ field }) => (
                <FormItem>
                <FormLabel>Facebook Profile URL</FormLabel>
                <FormControl><Input type="url" placeholder="https://facebook.com/username" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
                </FormItem>
            )}/>
        </div>
        
        {!isAdmin && (
          <FormField
            control={form.control}
            name="changeReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Change <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Explain why you are making these changes..."
                    className="min-h-[80px]"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormDescription>This reason is required for review.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {isAdmin && (
             <FormField
                control={form.control}
                name="changeReason"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Admin Change Note (Optional)</FormLabel>
                    <FormControl>
                    <Textarea
                        placeholder="Optional: Note for this direct update..."
                        className="min-h-[80px]"
                        {...field}
                         value={field.value ?? ''}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}


        <Button type="submit" disabled={isLoading || !isChanged || (!isAdmin && !form.watch("changeReason"))} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isAdmin ? 'Save Header Changes' : 'Submit Header Edits for Review'}
        </Button>
      </form>
    </Form>
  );
};

export default PoliticianHeaderForm;
