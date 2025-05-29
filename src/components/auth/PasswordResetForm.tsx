
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';


const passwordResetSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

export function PasswordResetForm() {
  const { toast } = useToast();
  const { supabase } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: PasswordResetFormValues) => {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      // redirectTo: `${window.location.origin}/auth/update-password`, // Supabase handles this, ensure this path exists if you customize update password form
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Password Reset Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for a link to reset your password.",
        duration: 8000,
      });
      router.push('/auth/login?message=reset_email_sent');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...form.register("email")}
          className={form.formState.errors.email ? "border-destructive" : ""}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Send Reset Link
      </Button>
    </form>
  );
}
