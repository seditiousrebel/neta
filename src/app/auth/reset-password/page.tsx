
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NetrikaLogo } from '@/components/icons/logo';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
         <Link href="/" className="inline-block mb-4" aria-label="Netrika Home">
            <NetrikaLogo className="h-10 w-auto mx-auto" />
        </Link>
        <CardTitle className="text-2xl">Reset Your Password</CardTitle>
        <CardDescription>Enter your email address and we&apos;ll send you a link to reset your password.</CardDescription>
      </CardHeader>
      <CardContent>
        <PasswordResetForm />
         <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
