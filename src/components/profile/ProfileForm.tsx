
"use client";

import { useState, useEffect, type ChangeEvent } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, Save } from 'lucide-react';
import type { User } from '@/types/entities'; // Using your app's User type
import { updateUserProfile } from '@/lib/actions/user.actions';
import { uploadAvatar, deleteAvatar } from '@/lib/supabase/storage';
import { useAuth } from '@/contexts/auth-context'; // To get Supabase client and user ID

const profileFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }).max(100),
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional().nullable(),
  avatarFile: z.instanceof(File).optional().nullable(), // For file input
  currentAvatarUrl: z.string().url().optional().nullable(), // To store the current avatar URL
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  currentUser: User; // Pass the initial user data
}

export function ProfileForm({ currentUser }: ProfileFormProps) {
  const { toast } = useToast();
  const { supabase, user: authUser } = useAuth(); // Get Supabase client and authUser for ID
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser.avatarUrl || null);
  const [currentAvatarPathForDeletion, setCurrentAvatarPathForDeletion] = useState<string | null>(null);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: currentUser.name || '',
      bio: currentUser.bio || '',
      avatarFile: null,
      currentAvatarUrl: currentUser.avatarUrl || null,
    },
  });

 useEffect(() => {
    // Logic to extract path from URL if needed for deletion.
    // Assumes avatarUrl might be the full public URL.
    if (currentUser.avatarUrl) {
        setAvatarPreview(currentUser.avatarUrl);
        try {
            const url = new URL(currentUser.avatarUrl);
            // Example path extraction: /storage/v1/object/public/avatars/user-id/image.png -> user-id/image.png
            const pathSegments = url.pathname.split('/');
            const bucketNameIndex = pathSegments.indexOf('avatars');
            if (bucketNameIndex !== -1 && bucketNameIndex + 1 < pathSegments.length) {
                setCurrentAvatarPathForDeletion(pathSegments.slice(bucketNameIndex + 1).join('/'));
            }
        } catch (e) {
            // If it's not a full URL or parsing fails, it might already be a path or invalid.
            // For simplicity, we'll attempt to delete based on what's there.
            // A more robust solution would store path and URL separately.
            setCurrentAvatarPathForDeletion(currentUser.avatarUrl);
        }
    }
  }, [currentUser.avatarUrl]);


  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('avatarFile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue('avatarFile', null);
      setAvatarPreview(currentUser.avatarUrl || null); // Reset to original if file cleared
    }
  };

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!authUser?.id || !supabase) {
      toast({ title: "Error", description: "User not authenticated or Supabase client unavailable.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const formDataToSubmit = new FormData();
    formDataToSubmit.append('fullName', data.fullName);
    if (data.bio) formDataToSubmit.append('bio', data.bio);

    let newAvatarPublicUrl: string | null = null;
    let uploadedAvatarPath: string | null = null;

    if (data.avatarFile) {
      try {
        const { path, publicUrl } = await uploadAvatar(supabase, authUser.id, data.avatarFile);
        newAvatarPublicUrl = publicUrl;
        uploadedAvatarPath = path; // Keep track of the new path for potential future deletion
        formDataToSubmit.append('newAvatarUrl', newAvatarPublicUrl);

        // Attempt to delete old avatar only if a new one is successfully uploaded
        if (currentAvatarPathForDeletion && currentAvatarPathForDeletion !== uploadedAvatarPath) {
           await deleteAvatar(supabase, currentAvatarPathForDeletion);
        }

      } catch (error: any) {
        toast({ title: "Avatar Upload Failed", description: error.message || "Could not upload new avatar.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
    }
    
    const result = await updateUserProfile(formDataToSubmit);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Profile Updated", description: result.message });
      if (newAvatarPublicUrl) {
          // Update local state if avatar changed
          setAvatarPreview(newAvatarPublicUrl); 
          setCurrentAvatarPathForDeletion(uploadedAvatarPath); // Update path for next potential deletion
      }
      form.reset({ // Reset form with potentially new values
        fullName: data.fullName,
        bio: data.bio,
        avatarFile: null, // Clear the file input
        currentAvatarUrl: newAvatarPublicUrl || data.currentAvatarUrl,
      });
    } else {
      toast({
        title: "Update Failed",
        description: result.error || "Could not update profile.",
        variant: "destructive",
        // @ts-ignore
        details: result.details,
      });
    }
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
          <Avatar className="h-32 w-32 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarImage src={avatarPreview || undefined} alt={currentUser.name || "User"} data-ai-hint="profile large" />
            <AvatarFallback className="text-4xl">{getInitials(currentUser.name)}</AvatarFallback>
          </Avatar>
          <Label 
            htmlFor="avatarFile" 
            className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity"
          >
            <Camera className="h-8 w-8" />
            <span className="sr-only">Change avatar</span>
          </Label>
          <Input
            id="avatarFile"
            type="file"
            accept="image/png, image/jpeg, image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
         {form.formState.errors.avatarFile && <p className="text-sm text-destructive">{form.formState.errors.avatarFile.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" {...form.register("fullName")} />
        {form.formState.errors.fullName && <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio (Optional)</Label>
        <Textarea id="bio" {...form.register("bio")} placeholder="Tell us a little about yourself..." rows={4} />
        {form.formState.errors.bio && <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save Changes
      </Button>
    </form>
  );
}
