
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NetrikaLogo } from '@/components/icons/logo';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
         <Link href="/" className="inline-block mb-4" aria-label="Netrika Home">
            <NetrikaLogo className="h-10 w-auto mx-auto" />
        </Link>
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>Join Netrika to start tracking political entities.</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
