// src/components/admin/politicians/PoliticianReview.tsx
"use client"; 

import React, { useEffect, useState } from 'react';
import type { AdminPendingEdit } from '@/types/entities';
import type { PoliticianFormData } from '@/components/contribute/PoliticianForm'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search } from 'lucide-react';
import Image from 'next/image'; 

// Import the server action
// import { getPublicUrlForMediaAsset } from '@/lib/supabase/storage.server'; // Path to the new server file

const renderStructuredData = (label: string, dataString?: string | null) => {
  if (!dataString) return <p className="text-sm text-muted-foreground mt-1">No {label.toLowerCase()} provided.</p>;
  try {
    const data = JSON.parse(dataString);
    if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
         return (
            <div className="mt-2">
                <h4 className="font-semibold text-sm uppercase text-muted-foreground">{label}</h4>
                <pre className="text-xs whitespace-pre-wrap mt-1 bg-gray-50 p-2 rounded-md border">{JSON.stringify(data, null, 2)}</pre>
            </div>
        );
    }
    if (!Array.isArray(data) || data.length === 0) return <p className="text-sm text-muted-foreground mt-1">No {label.toLowerCase()} data or empty list.</p>;
    
    return (
      <div className="mt-2">
        <h4 className="font-semibold text-sm uppercase text-muted-foreground">{label}</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm mt-1">
          {data.map((item: any, index: number) => (
            <li key={index}>
              {typeof item === 'object' ? 
                (<pre className="whitespace-pre-wrap text-xs bg-gray-100 p-1 rounded">{JSON.stringify(item, null, 2)}</pre>) : 
                String(item)
              }
            </li>
          ))}
        </ul>
      </div>
    );
  } catch (e) {
    return (
      <div className="mt-2">
        <h4 className="font-semibold text-sm uppercase text-muted-foreground">{label}</h4>
        <p className="text-sm whitespace-pre-wrap mt-1 bg-gray-50 p-2 rounded-md border">{dataString}</p>
      </div>
    );
  }
};

interface PoliticianReviewProps {
  edit: AdminPendingEdit;
}

const PoliticianReview: React.FC<PoliticianReviewProps> = ({ edit }) => {
  const proposedData = edit.proposed_data as PoliticianFormData | null | undefined;
  
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For approve/deny actions
  const [isImageLoading, setIsImageLoading] = useState(false); // For image URL fetching

  useEffect(() => {
    if (proposedData?.photo_asset_id) {
      setIsImageLoading(true);
      // This is where you would typically call a server action or an API route
      // that can then call getPublicUrlForMediaAsset.
      // For now, we'll log and set a placeholder or leave it to be implemented.
      console.log("TODO: Implement fetching public URL for asset ID:", proposedData.photo_asset_id);
      // Example of how it might be called if a direct server action import was feasible (which it isn't directly from client component for server fns):
      // getPublicUrlForMediaAsset(proposedData.photo_asset_id)
      //   .then(url => {
      //     setPhotoUrl(url);
      //   })
      //   .catch(console.error)
      //   .finally(() => setIsImageLoading(false));
      
      // Simulate fetching for now or if you have an API route:
      // fetch(`/api/media-url?assetId=${proposedData.photo_asset_id}`)
      //   .then(res => res.json())
      //   .then(data => {
      //     if(data.url) setPhotoUrl(data.url);
      //   })
      //   .catch(console.error)
      //   .finally(() => setIsImageLoading(false));
      setIsImageLoading(false); // Remove this if actual fetching is implemented
    }
  }, [proposedData?.photo_asset_id]);

  const handleApprove = async () => {
    setIsLoading(true);
    alert(`Placeholder: Approving edit ID: ${edit.id}.`);
    // Actual implementation would involve calling a server action:
    // await approvePendingEditAction(edit.id);
    // Then revalidate/refresh data.
    setIsLoading(false);
  };

  const handleDeny = async () => {
    setIsLoading(true);
    // const reason = prompt("Enter reason for denial (optional):");
    alert(`Placeholder: Denying edit ID: ${edit.id}.`);
    // Actual implementation:
    // await denyPendingEditAction(edit.id, reason || "Denied by admin review.");
    // Then revalidate/refresh data.
    setIsLoading(false);
  };

  if (!proposedData) {
    return (
      <Card>
        <CardHeader><CardTitle>Error</CardTitle></CardHeader>
        <CardContent><p>No proposed data found for this edit.</p></CardContent>
      </Card>
    );
  }
  
  const hasContent = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object') return false;
    return Object.values(obj).some(value => !!value);
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Review Politician: {proposedData.name || "N/A"}</CardTitle>
        <CardDescription className="text-xs">
          Submitted by: {edit.users?.full_name || edit.users?.email || edit.proposer_id} on {new Date(edit.created_at).toLocaleDateString()}
          <br/>Current Status: <Badge variant={edit.status === 'Pending' ? 'warning' : edit.status === 'Approved' ? 'success' : 'destructive'} className="text-xs">{edit.status}</Badge>
          {edit.change_reason && <p className="mt-1 italic">Reason: &quot;{edit.change_reason}&quot;</p>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {proposedData.photo_asset_id && (
          <div className="mb-3">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-1">Photo</h3>
            {isImageLoading && <p className="text-xs text-muted-foreground">Loading image...</p>}
            {photoUrl && !isImageLoading && (
              <Image src={photoUrl} alt={`Photo of ${proposedData.name}`} width={128} height={128} className="rounded-md object-cover border shadow-sm" />
            )}
            {!photoUrl && !isImageLoading && (
              <div className="text-xs text-muted-foreground p-2 border rounded-md bg-gray-50">
                <p>Photo Asset ID: {proposedData.photo_asset_id}</p>
                <p className="italic mt-1">Preview not available (TODO: Implement image URL fetching via server action/API route).</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
          <div><span className="font-medium text-muted-foreground">Name (English):</span> {proposedData.name || "N/A"} 
            {proposedData.name && 
              <a href={`https://www.google.com/search?q=${encodeURIComponent(proposedData.name)}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:text-blue-700" title="Search on Google">
                <Search className="inline h-3.5 w-3.5" />
              </a>
            }
          </div>
          {proposedData.name_nepali && <div><span className="font-medium text-muted-foreground">Name (Nepali):</span> {proposedData.name_nepali}</div>}
          <div><span className="font-medium text-muted-foreground">Date of Birth (BS):</span> {proposedData.dob || "N/A"}</div>
          <div><span className="font-medium text-muted-foreground">Gender:</span> <Badge variant="outline" className="text-xs py-0.5">{proposedData.gender || "N/A"}</Badge></div>
        </div>
        
        {proposedData.biography && (
          <div className="mt-2">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground">Biography</h4>
            <p className="text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded-md border mt-1">{proposedData.biography}</p>
          </div>
        )}
        
        {renderStructuredData("Education Details", proposedData.education_details)}
        {renderStructuredData("Political Journey", proposedData.political_journey)}
        {renderStructuredData("Criminal Records", proposedData.criminal_records)}
        {renderStructuredData("Asset Declarations", proposedData.asset_declarations)}

        {hasContent(proposedData.contact_information) && (
          <div className="mt-2">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground">Contact Information</h4>
            <div className="space-y-0.5 mt-1 text-xs bg-gray-50 p-2 rounded-md border">
              {proposedData.contact_information?.email && <p><span className="font-medium">Email:</span> {proposedData.contact_information.email}</p>}
              {proposedData.contact_information?.phone && <p><span className="font-medium">Phone:</span> {proposedData.contact_information.phone}</p>}
              {proposedData.contact_information?.address && <p><span className="font-medium">Address:</span> {proposedData.contact_information.address}</p>}
            </div>
          </div>
        )}

        {hasContent(proposedData.social_media_handles) && (
          <div className="mt-2">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground">Social Media</h4>
            <ul className="list-none space-y-0.5 mt-1 text-xs bg-gray-50 p-2 rounded-md border">
              {Object.entries(proposedData.social_media_handles || {})
                .filter(([_, handle]) => handle) 
                .map(([platform, handle]) => 
                  <li key={platform} className="capitalize">
                    <span className="font-medium">{platform}:</span>{' '}
                    <a href={String(handle)} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {String(handle)} <ExternalLink className="inline h-3 w-3" />
                    </a>
                  </li>
              )}
            </ul>
          </div>
        )}
        
        <div className="mt-4 border-t pt-3 flex space-x-2">
            <Button onClick={handleApprove} variant="default" size="sm" disabled={isLoading || edit.status !== 'Pending'} className="bg-green-600 hover:bg-green-700 focus-visible:ring-green-500">
              {isLoading ? 'Processing...' : 'Approve (Placeholder)'}
            </Button>
            <Button onClick={handleDeny} variant="destructive" size="sm" disabled={isLoading || edit.status !== 'Pending'}>
              {isLoading ? 'Processing...' : 'Deny (Placeholder)'}
            </Button>
        </div>
        {edit.status !== 'Pending' && <p className="text-xs text-amber-600 mt-1">This edit has already been {edit.status.toLowerCase()}. Actions are disabled.</p>}
        <p className="text-xs text-muted-foreground mt-1">Actual approval/denial logic to be implemented via server actions.</p>
      </CardContent>
    </Card>
  );
};
export default PoliticianReview;
