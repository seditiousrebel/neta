// src/app/contribute/politician/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import PoliticianForm, { PoliticianFormData } from '@/components/contribute/PoliticianForm';
import { submitPolitician } from '@/lib/supabase/contributions'; // Adjust path
import { useAuth } from '@/contexts/auth-context'; // Adjust path
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // For preview
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For messages
import Link from 'next/link';
// Assuming a toast hook is available, e.g., from sonner or shadcn/ui's useToast
// import { useToast } from "@/components/ui/use-toast"; // Example

const ContributePoliticianPage = () => {
  const { user, loading: authLoading } = useAuth(); // Assuming useAuth provides user and loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ editId: string; message: string } | null>(null);
  const [previewData, setPreviewData] = useState<PoliticianFormData | null>(null);
  
  // const { toast } = useToast(); // Example toast usage

  useEffect(() => {
    // If user is not logged in after auth check, redirect or show message
    if (!authLoading && !user) {
      // router.push('/login'); // Or handle appropriately
      // setError("You must be logged in to contribute."); // This would show on the form page, better to show a dedicated message.
    }
  }, [user, authLoading]);

  const handleFormSubmit = (data: PoliticianFormData) => {
    setError(null);
    setSuccessInfo(null);
    setPreviewData(data); // Show preview first
  };

  const handleEdit = () => {
    setPreviewData(null); // Go back to form
  };

  const handleConfirmSubmit = async () => {
    if (!previewData || !user) {
      setError("No data to submit or user not found.");
      // toast({ title: "Error", description: "No data to submit or user not found.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessInfo(null);

    try {
      // The photo_asset_id should already be in previewData if upload was successful in the form
      const result = await submitPolitician(previewData, user.id);

      if (result.error) {
        throw result.error;
      }

      // Assuming submitPolitician returns { data: [{id: "some-uuid"}], error: null } on success
      // and pending_edits has an 'id' column that is a string (uuid).
      if (result.data && Array.isArray(result.data) && result.data.length > 0 && result.data[0].id) {
        const editId = String(result.data[0].id); 
        setSuccessInfo({ editId, message: `Contribution submitted successfully! Your Edit ID is ${editId}.` });
        // toast({ title: "Success!", description: `Contribution submitted. Edit ID: ${editId}` });
        setPreviewData(null); // Clear preview
      } else {
        // This case handles if result.data is null, not an array, empty, or item has no id
        console.error("Submission response missing data or id:", result);
        throw new Error("Submission succeeded but no valid data or ID returned.");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      const errorMessage = err.message || "An unexpected error occurred.";
      setError(errorMessage);
      // toast({ title: "Submission Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading) {
    return (
        <div className="container mx-auto p-4 text-center">
            <p>Loading authentication details...</p>
        </div>
    );
  }

  if (!user) {
    return (
        <div className="container mx-auto p-4 max-w-xl">
            <Alert variant="destructive">
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You must be logged in to contribute. Please <Link href="/auth/login" className="font-semibold hover:underline">Login</Link> or <Link href="/auth/register" className="font-semibold hover:underline">Register</Link>.
              </AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 py-8 md:py-12 max-w-3xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Contribute Politician Information</h1>
        <p className="text-muted-foreground mt-2">Help us build a comprehensive database by adding new politician profiles.</p>
      </header>


      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error Submitting Contribution</AlertTitle>
          <AlertDescription>
            {error}
            {previewData && ( 
                 <Button onClick={handleConfirmSubmit} disabled={isLoading} variant="outline" size="sm" className="mt-3">
                {isLoading ? 'Retrying...' : 'Retry Submission'}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {successInfo && (
        <Alert variant="success" className="mb-6">
          <AlertTitle>Contribution Submitted!</AlertTitle>
          <AlertDescription>
            {successInfo.message}
            <p className="mt-2">
              You can track your contribution here: {' '}
              <Link href={`/contribution/${successInfo.editId}`} className="font-semibold hover:underline">
                Track Contribution (ID: {successInfo.editId})
              </Link>
            </p>
            <Button onClick={() => {
                setSuccessInfo(null); 
                setPreviewData(null); 
                // Consider resetting PoliticianForm if it holds state internally, e.g. by changing its key
            }} className="mt-3" variant="outline" size="sm">
                Add Another Politician
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!previewData && !successInfo && ( 
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">New Politician Details</CardTitle>
            <CardDescription>Please fill in the information as accurately as possible. All contributions are reviewed.</CardDescription>
          </CardHeader>
          <CardContent>
            <PoliticianForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </CardContent>
        </Card>
      )}

      {previewData && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Preview Contribution</CardTitle>
            <CardDescription>Review the information below. If everything is correct, confirm your submission.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(previewData).map(([key, value]) => {
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Format key to Title Case
              if (value && typeof value === 'object' && value !== null) {
                return (
                  <div key={key} className="py-1">
                    <h3 className="text-sm font-medium text-gray-500">{label}:</h3>
                    <pre className="mt-1 bg-gray-50 p-3 rounded-md text-xs whitespace-pre-wrap border">
                        {JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                );
              }
              if (value || typeof value === 'boolean' || typeof value === 'number') { 
                return (
                  <div key={key} className="py-1">
                    <span className="text-sm font-medium text-gray-500">{label}:</span>{' '}
                    <span className="text-sm text-gray-800">{String(value)}</span>
                  </div>
                );
              }
              return null;
            })}
            <div className="flex justify-end space-x-3 pt-5 border-t mt-5">
              <Button variant="outline" onClick={handleEdit} disabled={isLoading}>
                Back to Edit
              </Button>
              <Button onClick={handleConfirmSubmit} disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Confirm & Submit Contribution'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContributePoliticianPage;
