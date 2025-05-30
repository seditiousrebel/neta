
// src/app/politicians/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import PoliticianForm, { type PoliticianFormData } from '@/components/contribute/PoliticianForm';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { getPoliticianById } from '@/lib/supabase/politicians'; // To fetch existing data
import { submitFullPoliticianUpdate } from '@/lib/actions/politician.actions'; // New action
import { useRouter, notFound } from 'next/navigation';

interface EditPoliticianPageProps {
  params: { id: string };
}

const EditPoliticianPage: React.FC<EditPoliticianPageProps> = ({ params }) => {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const politicianId = params.id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ editId: string; message: string } | null>(null);
  const [previewData, setPreviewData] = useState<PoliticianFormData | null>(null);
  const [initialData, setInitialData] = useState<Partial<PoliticianFormData> | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);

  useEffect(() => {
    if (!politicianId) {
      notFound();
      return;
    }
    const fetchInitialData = async () => {
      setIsLoadingInitialData(true);
      const data = await getPoliticianById(politicianId);
      if (data) {
        setInitialData(data);
      } else {
        setError("Politician data not found or failed to load.");
        // Optionally redirect or show a more permanent error
      }
      setIsLoadingInitialData(false);
    };
    fetchInitialData();
  }, [politicianId]);


  const handleFormSubmitToPreview = (data: PoliticianFormData) => {
    setError(null);
    setSuccessInfo(null);
    setPreviewData(data);
  };

  const handleEditPreview = () => {
    setPreviewData(null); // Go back to editing the form
  };

  const handleConfirmSubmit = async () => {
    if (!previewData || !user || !politicianId) {
      setError("No data to submit, user not found, or politician ID missing.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const result = await submitFullPoliticianUpdate(politicianId, previewData, user.id);

      if (result.error || !result.editId) {
        console.error("Submission error or invalid response:", result.error, result.editId);
        throw new Error(result.error || "Submission failed or no valid Edit ID returned.");
      }
      
      const editId = String(result.editId);
      setSuccessInfo({ editId, message: `Edit submitted successfully! Your Edit ID is ${editId}. It will be reviewed by an admin.` });
      setPreviewData(null); // Clear preview
    } catch (err: any) {
      console.error("Submission error:", err);
      const errorMessage = err.message || "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authLoading || isLoadingInitialData) {
    return (
      <div className="container mx-auto p-4 py-12 text-center flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">
          {authLoading ? "Loading authentication details..." : "Loading politician data..."}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 py-12 max-w-xl">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be logged in to edit politician profiles. Please <Link href={`/auth/login?next=/politicians/${politicianId}/edit`} className="font-semibold hover:underline">Login</Link> or <Link href="/auth/register" className="font-semibold hover:underline">Register</Link>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!initialData && !isLoadingInitialData) {
     return (
      <div className="container mx-auto p-4 py-12 max-w-xl">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            Could not load existing data for this politician. Please ensure the ID is correct or try again later.
            <Button onClick={() => router.back()} variant="outline" className="mt-3">Go Back</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4 py-8 md:py-12 max-w-3xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Edit Politician Profile</h1>
        <p className="text-muted-foreground mt-2">
          Editing profile for: <span className="font-semibold text-foreground">{initialData?.name || `ID: ${politicianId}`}</span>.
          All edits are reviewed by administrators.
        </p>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error Submitting Edit</AlertTitle>
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
           <AlertTitle className="font-semibold">Edit Submitted!</AlertTitle>
          <AlertDescription>
            {successInfo.message}
            <p className="mt-2">
              You can track your edit on your profile page (once that feature is implemented).
            </p>
            <Button onClick={() => router.push(`/politicians/${politicianId}`)} className="mt-3" variant="outline" size="sm">
                View Politician Profile
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!previewData && !successInfo && initialData && ( 
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Politician Details</CardTitle>
            <CardDescription>Please update the information as accurately as possible. All edits are reviewed.</CardDescription>
          </CardHeader>
          <CardContent>
            <PoliticianForm 
              onSubmit={handleFormSubmitToPreview} 
              isLoading={isSubmitting}
              mode="edit"
              politicianId={politicianId}
              initialData={initialData}
            />
          </CardContent>
        </Card>
      )}

      {previewData && !successInfo && (
        <Card className="shadow-lg border-accent/30">
          <CardHeader>
            <CardTitle className="text-2xl">Preview Edits</CardTitle>
            <CardDescription>Review your proposed changes below. If everything is correct, confirm your submission.</CardDescription>
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
                displayValue = <span className="italic text-muted-foreground">Not provided / Unchanged</span>;
              } else {
                displayValue = String(value);
              }
              
              const originalValue = initialData ? (initialData as any)[key] : undefined;
              const isChanged = JSON.stringify(value) !== JSON.stringify(originalValue);

              return (
                <div key={key} className={`py-1.5 border-b last:border-b-0 ${isChanged ? 'bg-yellow-50 dark:bg-yellow-900/20 rounded-md p-2' : 'p-2'}`}>
                  <span className="text-sm font-medium text-muted-foreground">{label}:</span>{' '}
                  <span className="text-sm text-foreground">{displayValue}</span>
                  {isChanged && originalValue !== undefined && (
                     <p className="text-xs text-orange-600 dark:text-orange-400 ml-2 pl-2 border-l-2 border-orange-300 dark:border-orange-500 mt-0.5">
                        Original: <span className="italic">{JSON.stringify(originalValue, null, 2).length > 100 ? 'Complex value' : String(originalValue)}</span>
                    </p>
                  )}
                </div>
              );
            })}
            <div className="flex justify-end space-x-3 pt-5 border-t mt-5">
              <Button variant="outline" onClick={handleEditPreview} disabled={isSubmitting}>
                Back to Edit Form
              </Button>
              <Button onClick={handleConfirmSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit Edits'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EditPoliticianPage;
    