// src/app/contribute/politician/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import PoliticianForm, { PoliticianFormData } from '@/components/contribute/PoliticianForm';
import { submitNewPoliticianContribution } from '@/lib/supabase/contributions';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

const ContributePoliticianPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ editId: string; message: string } | null>(null);
  const [previewData, setPreviewData] = useState<PoliticianFormData | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      // Handled by UI below
    }
  }, [user, authLoading]);

  const handleFormSubmitToPreview = (data: PoliticianFormData) => {
    setError(null);
    setSuccessInfo(null);
    setPreviewData(data);
  };

  const handleEditPreview = () => {
    setPreviewData(null);
  };

  const handleConfirmSubmit = async () => {
    if (!previewData || !user) {
      setError("No data to submit or user not found.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const result = await submitNewPoliticianContribution(previewData, user.id);

      if (result.error || !result.data || result.data.length === 0 || !result.data[0].id) {
        console.error("Submission error or invalid response:", result.error, result.data);
        throw new Error(result.error?.message || "Submission failed or no valid ID returned.");
      }
      
      const editId = String(result.data[0].id);
      setSuccessInfo({ editId, message: `Contribution submitted successfully! Your Edit ID is ${editId}. It will be reviewed by an admin.` });
      setPreviewData(null); // Clear preview
    } catch (err: any) {
      console.error("Submission error:", err);
      const errorMessage = err.message || "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="container mx-auto p-4 py-12 text-center flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading authentication details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 py-12 max-w-xl">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be logged in to contribute. Please <Link href="/auth/login?next=/contribute/politician" className="font-semibold hover:underline">Login</Link> or <Link href="/auth/register" className="font-semibold hover:underline">Register</Link>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 py-8 md:py-12 max-w-3xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Contribute New Politician</h1>
        <p className="text-muted-foreground mt-2">Help us build a comprehensive database by adding new politician profiles. All contributions are reviewed by administrators.</p>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error Submitting Contribution</AlertTitle>
          <AlertDescription>
            {error}
            {previewData && ( 
              <Button onClick={handleConfirmSubmit} disabled={isSubmitting} variant="outline" size="sm" className="mt-3">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Retrying...' : 'Retry Submission'}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {successInfo && (
        <Alert variant="default" className="mb-6 bg-green-50 border-green-200 text-green-700 [&>svg~*]:pl-7 [&>svg]:text-green-600">
           <AlertTitle className="font-semibold">Contribution Submitted!</AlertTitle>
          <AlertDescription>
            {successInfo.message}
            <p className="mt-2">
              You can track your contribution on your profile page once that feature is implemented.
            </p>
            <Button onClick={() => {
                setSuccessInfo(null); 
                setPreviewData(null);
            }} className="mt-3" variant="outline" size="sm">
                Add Another Politician
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!previewData && !successInfo && ( 
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">New Politician Details</CardTitle>
            <CardDescription>Please fill in the information as accurately as possible. All contributions are reviewed.</CardDescription>
          </CardHeader>
          <CardContent>
            <PoliticianForm onSubmit={handleFormSubmitToPreview} isLoading={isSubmitting} />
          </CardContent>
        </Card>
      )}

      {previewData && !successInfo && (
        <Card className="shadow-lg border-accent/30">
          <CardHeader>
            <CardTitle className="text-2xl">Preview Contribution</CardTitle>
            <CardDescription>Review the information below. If everything is correct, confirm your submission.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(previewData).map(([key, value]) => {
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              let displayValue = String(value ?? "N/A");
              if (value && typeof value === 'object' && !Array.isArray(value)) {
                displayValue = JSON.stringify(value, null, 2);
                 return (
                  <div key={key} className="py-1.5 border-b last:border-b-0">
                    <h3 className="text-sm font-medium text-muted-foreground">{label}:</h3>
                    <pre className="mt-1 text-xs bg-muted/50 p-2 rounded-md whitespace-pre-wrap border">
                        {displayValue}
                    </pre>
                  </div>
                );
              }
               if (value === null || value === undefined || value === '') {
                displayValue = <span className="italic text-muted-foreground">Not provided</span>;
              } else {
                displayValue = String(value);
              }
              
              return (
                <div key={key} className="py-1.5 border-b last:border-b-0">
                  <span className="text-sm font-medium text-muted-foreground">{label}:</span>{' '}
                  <span className="text-sm text-foreground">{displayValue}</span>
                </div>
              );
            })}
            <div className="flex justify-end space-x-3 pt-5 border-t mt-5">
              <Button variant="outline" onClick={handleEditPreview} disabled={isSubmitting}>
                Back to Edit
              </Button>
              <Button onClick={handleConfirmSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit Contribution'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContributePoliticianPage;
