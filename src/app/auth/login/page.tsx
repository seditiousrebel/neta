
import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NetrikaLogo } from '@/components/icons/logo';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <Link href="/" className="inline-block mb-4" aria-label="Netrika Home">
            <NetrikaLogo className="h-10 w-auto mx-auto" />
        </Link>
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>Log in to continue to Netrika.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
         <p className="mt-2 text-center text-sm text-muted-foreground">
          <Link href="/auth/reset-password" className="font-medium text-primary hover:underline">
            Forgot your password?
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
