
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form'; // Added Controller
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import Link from 'next/link';
import { Progress } from "@/components/ui/progress";

const registerSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password." }),
  acceptTerms: z.boolean().refine(val => val === true, { message: "You must accept the terms and conditions." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], // Set error on confirmPassword field
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4; // 0: too weak, 1: weak, 2: medium, 3: strong, 4: very strong
  text: string;
  color: string;
};

const getPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  if (!password || password.length < 6) return { score: 0, text: "Too short", color: "bg-destructive" };
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++; // Special character

  score = Math.min(score, 4); // Cap score at 4 for UI simplicity

  if (score <= 1) return { score: 1, text: "Weak", color: "bg-red-500" };
  if (score === 2) return { score: 2, text: "Medium", color: "bg-yellow-500" };
  if (score === 3) return { score: 3, text: "Strong", color: "bg-green-500" };
  return { score: 4, text: "Very Strong", color: "bg-green-700" };
};


export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { supabase } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, text: "Too short", color: "bg-destructive" });

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const currentPassword = form.watch("password");
  useEffect(() => {
    setPasswordStrength(getPasswordStrength(currentPassword || ""));
  }, [currentPassword]);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          // Supabase trigger should populate public.users with role 'User' and contribution_points 0
        },
        // For email confirmation, Supabase sends an email.
        // The user clicks the link which hits /auth/callback
        // emailRedirectTo: `${window.location.origin}/auth/callback`, // Handled by Supabase settings
      },
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Registration Successful!",
        description: "Please check your email to confirm your account and then log in.",
        duration: 8000,
      });
      router.push('/auth/login?message=registration_success');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          {...form.register("fullName")}
          className={form.formState.errors.fullName ? "border-destructive" : ""}
          autoComplete="name"
        />
        {form.formState.errors.fullName && (
          <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
        )}
      </div>
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
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            {...form.register("password")}
            className={form.formState.errors.password ? "border-destructive pr-10" : "pr-10"}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {passwordStrength.score > 0 && (
           <div className="mt-1">
            <Progress value={passwordStrength.score * 25} className={`h-2 ${passwordStrength.color}`} />
            <p className={`text-xs mt-1 ${
              passwordStrength.score === 1 ? 'text-red-500' :
              passwordStrength.score === 2 ? 'text-yellow-600' :
              passwordStrength.score >= 3 ? 'text-green-600' : 'text-muted-foreground'
            }`}>Strength: {passwordStrength.text}</p>
          </div>
        )}
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
            <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            {...form.register("confirmPassword")}
            className={form.formState.errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
            />
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
        </div>
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="items-top flex space-x-2">
        <Controller
            name="acceptTerms"
            control={form.control}
            render={({ field }) => (
                <Checkbox
                    id="acceptTerms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    ref={field.ref}
                    aria-invalid={form.formState.errors.acceptTerms ? "true" : "false"}
                    className="mt-0.5" // Added for better alignment with label
                />
            )}
        />
        <div className="grid gap-1.5 leading-none">
            <Label htmlFor="acceptTerms" className="text-sm font-normal">
                I accept the{' '}
                <Link href="/terms" className="underline hover:text-primary" target="_blank">
                    Terms and Conditions
                </Link>
            </Label>
             {form.formState.errors.acceptTerms && (
              <p className="text-sm text-destructive">{form.formState.errors.acceptTerms.message}</p>
            )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Create Account
      </Button>
    </form>
  );
}
