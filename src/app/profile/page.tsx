
"use client";

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { LogOut, UserCircle, Edit, ShieldCheck, Award, Activity, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateUserProfile } from '@/lib/actions/user.actions';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } } from 'react';

const profileSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  avatarUrl: z.string().url({ message: "Please enter a valid URL."}).or(z.literal("")).optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isAuthenticated, logout, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.name || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.name || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user, form]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
  }

  const handleEditProfile = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('avatarUrl', data.avatarUrl || '');

    const result = await updateUserProfile(formData);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Profile Updated", description: result.message });
      setIsEditing(false);
      // AuthContext will eventually update via onAuthStateChange USER_UPDATED event
    } else {
      toast({ 
        title: "Update Failed", 
        description: result.error || "Could not update profile.", 
        variant: "destructive",
        // @ts-ignore // TODO: Fix this type error if details exist
        details: result.details 
      });
    }
  };

  if (authIsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3 mb-4" /> {/* Title skeleton */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card className="max-w-2xl mx-auto mt-6">
           <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
           <CardContent><Skeleton className="h-20 w-full" /></CardContent>
        </Card>
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    // This case should ideally be handled by middleware redirecting to /auth/login
    return (
      <div className="space-y-6 text-center py-12">
        <UserCircle className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="text-muted-foreground">You are not logged in.</p>
        <p className="text-sm">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
        {!isEditing && (
           <Button variant="outline" onClick={() => setIsEditing(true)}>
             <Edit className="mr-2 h-4 w-4" /> Edit Profile
           </Button>
        )}
      </div>
      
      <Card className="max-w-2xl mx-auto shadow-lg rounded-xl">
        <form onSubmit={form.handleSubmit(handleEditProfile)}>
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-background">
              <AvatarImage src={form.watch('avatarUrl') || user.avatarUrl || ''} alt={user.name || 'User'} data-ai-hint="profile picture" />
              <AvatarFallback className="text-3xl">{getInitials(form.watch('fullName') || user.name)}</AvatarFallback>
            </Avatar>
            {isEditing ? (
              <div className='w-full px-6 space-y-1'>
                 <Label htmlFor="fullName" className='sr-only'>Full Name</Label>
                 <Input id="fullName" {...form.register("fullName")} placeholder="Full Name" className="text-2xl font-semibold text-center h-auto p-1" />
                 {form.formState.errors.fullName && <p className="text-sm text-destructive text-center">{form.formState.errors.fullName.message}</p>}
                
                 <Label htmlFor="avatarUrl" className='sr-only'>Avatar URL</Label>
                 <Input id="avatarUrl" {...form.register("avatarUrl")} placeholder="Avatar URL (e.g., https://...)" className="text-xs text-center h-auto p-1"/>
                 {form.formState.errors.avatarUrl && <p className="text-sm text-destructive text-center">{form.formState.errors.avatarUrl.message}</p>}
              </div>
            ) : (
              <>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </>
            )}
              {user.role && (
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <ShieldCheck className="mr-1.5 h-4 w-4 text-primary" />
                  Role: {user.role}
                </div>
              )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="flex gap-2 justify-center">
                <Button type="button" variant="outline" onClick={() => {setIsEditing(false); form.reset({fullName: user.name || '', avatarUrl: user.avatarUrl || ''});}}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </div>
            ) : (
               <Button onClick={logout} variant="destructive" className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" /> Log Out
              </Button>
            )}
          </CardContent>
        </form>
      </Card>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>Your activity and achievements on Netrika.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 text-center">
            <div>
                <p className="text-3xl font-bold text-primary">{user.contributionPoints ?? 0}</p>
                <p className="text-sm text-muted-foreground">Contribution Points</p>
            </div>
            <div> {/* Placeholder for badges count */}
                <p className="text-3xl font-bold">0</p> 
                <p className="text-sm text-muted-foreground">Badges Earned</p>
            </div>
            {/* Other stats from old profile page - can be re-added if data source exists */}
        </CardContent>
      </Card>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><Award className="mr-2 h-5 w-5 text-primary" /> User Badges (Coming Soon)</CardTitle>
          <CardDescription>Badges you&apos;ve earned for your contributions.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No badges earned yet, or this feature is under development.</p>
        </CardContent>
      </Card>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" /> My Contributions (Coming Soon)</CardTitle>
          <CardDescription>A log of your edits and other activities on Netrika.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your contribution history will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
