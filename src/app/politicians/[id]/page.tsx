// src/app/politicians/[id]/page.tsx
import React from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getPublicUrlForMediaAsset } from '@/lib/supabase/storage.server.ts';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { User, Cake, VenetianMask, Info, Twitter, Facebook, Instagram, Globe, Mail, Phone, MapPin } from 'lucide-react'; 
import { notFound } from 'next/navigation'; 
import type { PoliticianFormData } from '@/components/contribute/PoliticianForm'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import Overview from '@/components/politicians/profile/Overview';
import CareerTimeline from '@/components/politicians/profile/CareerTimeline';
import CriminalRecords from '@/components/politicians/profile/CriminalRecords';


export interface PoliticianProfileData extends PoliticianFormData {
  id: string; 
  created_at?: string;
  updated_at?: string;
  status?: string; 
}


async function fetchPoliticianById(id: string): Promise<{ politician: PoliticianProfileData | null; photoUrl: string | null }> {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('politicians')
    .select('*') 
    .eq('id', id)
    .eq('status', 'Approved') 
    .single();

  if (error) {
    console.error(`Error fetching politician with ID ${id}: ${error.message}`);
    if (error.code === 'PGRST116') { // Code for "No rows found" with .single()
        notFound();
    }
    // For other errors, we might not want to show a 404 but an error message,
    // but for this page, notFound() is generally appropriate if data can't be fetched.
    return { politician: null, photoUrl: null }; 
  }
  
  if (!data) { 
    notFound();
  }

  const politician = data as PoliticianProfileData;
  politician.id = String(data.id); 

  let photoUrl: string | null = null;
  if (politician.photo_asset_id) {
    photoUrl = await getPublicUrlForMediaAsset(politician.photo_asset_id);
  }

  return { politician, photoUrl };
}

export default async function PoliticianProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { politician, photoUrl } = await fetchPoliticianById(id);

  if (!politician) {
    // This should ideally be caught by notFound() in fetchPoliticianById,
    // but as a safeguard:
    notFound();
  }

  const renderField = (label: string, value?: string | number | null, icon?: React.ReactNode, isLink: boolean = false) => {
    if (value === undefined || value === null || String(value).trim() === '') return null;
    return (
      <div className="flex items-start text-sm text-gray-700 dark:text-gray-300 mb-1.5">
        {icon && React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0"})}
        <span className="font-semibold min-w-[100px] sm:min-w-[120px]">{label}:</span>
        {isLink && typeof value === 'string' ? (
            <a href={value.startsWith('http') ? value : `mailto:${value}`} target="_blank" rel="noopener noreferrer" className="ml-2 hover:underline text-primary dark:text-blue-400 break-all">
                {value}
            </a>
        ) : (
            <span className="ml-2 break-words">{String(value)}</span>
        )}
      </div>
    );
  };
  
  const renderSocialLink = (platformKey: keyof NonNullable<PoliticianFormData['social_media_handles']>, url?: string | null) => {
    if (!url) return null;
    let IconComponent: React.ElementType = Globe; 
    let platformName = platformKey.charAt(0).toUpperCase() + platformKey.slice(1);

    switch (platformKey) {
        case 'twitter': IconComponent = Twitter; platformName="Twitter"; break;
        case 'facebook': IconComponent = Facebook; platformName="Facebook"; break;
        case 'instagram': IconComponent = Instagram; platformName="Instagram"; break;
    }
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${politician.name}'s ${platformName} profile`}
           className="text-muted-foreground hover:text-primary p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors">
            <IconComponent className="h-5 w-5" />
        </a>
    );
  };

  return (
    <div className="container mx-auto p-4 py-8 md:py-12 max-w-5xl">
      <header className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
        <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full overflow-hidden shadow-xl border-4 border-white dark:border-gray-800 flex-shrink-0">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={`Photo of ${politician.name}`}
              fill
              sizes="(max-width: 768px) 144px, 192px"
              className="object-cover"
              priority 
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-person.png'; }} // Fallback for client-side error
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-full">
              <User className="w-24 h-24 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>
        <div className="text-center md:text-left pt-2 flex-grow">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{politician.name}</h1>
          {politician.name_nepali && (
            <p className="text-xl text-muted-foreground dark:text-gray-400 mt-1">{politician.name_nepali}</p>
          )}
          <div className="mt-4 space-y-1.5">
            {renderField("Date of Birth (BS)", politician.dob, <Cake />)}
            {renderField("Gender", politician.gender, <VenetianMask />)}
            {politician.contact_information?.email && renderField("Email", politician.contact_information.email, <Mail />, true)}
            {politician.contact_information?.phone && renderField("Phone", politician.contact_information.phone, <Phone />)}
            {politician.contact_information?.address && renderField("Address", politician.contact_information.address, <MapPin />)}
          </div>
          {(politician.social_media_handles && Object.values(politician.social_media_handles).some(h => h)) && (
            <div className="mt-5 flex items-center justify-center md:justify-start space-x-1"> {/* Reduced space for social icons */}
                {Object.entries(politician.social_media_handles)
                    .filter(([,url]) => url)
                    .map(([platform, url]) => renderSocialLink(platform as keyof PoliticianFormData['social_media_handles'], url))}
            </div>
          )}
        </div>
      </header>

      {/* Biography section removed, will be handled by Overview component in its tab */}
      
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 text-center">Detailed Information</h2>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1 mb-6 bg-gray-100 dark:bg-gray-800/40 p-1 rounded-md">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="career" className="text-xs sm:text-sm">Career</TabsTrigger>
            <TabsTrigger value="criminal_records" className="text-xs sm:text-sm">Criminal Records</TabsTrigger>
            <TabsTrigger value="assets" className="text-xs sm:text-sm">Assets</TabsTrigger>
            <TabsTrigger value="voting_record" className="text-xs sm:text-sm">Voting Record</TabsTrigger>
            <TabsTrigger value="edit_history" className="text-xs sm:text-sm">Edit History</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>A summary including biography and current political engagement.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Overview 
                  biography={politician.biography} 
                  politicalJourney={politician.political_journey}
                  currentPosition={politician.current_position_title}
                  currentParty={politician.current_party_name}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="career">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Career Timeline</CardTitle>
                <CardDescription>A chronological overview of their political journey and roles held.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <CareerTimeline politicalJourney={politician.political_journey} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="criminal_records">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Criminal Records</CardTitle>
                <CardDescription>Information related to any reported criminal records for this individual.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <CriminalRecords criminalRecordsData={politician.criminal_records} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="assets"><Card className="shadow-sm"><CardHeader><CardTitle>Asset Declarations</CardTitle></CardHeader><CardContent><p className="text-muted-foreground italic py-4">Asset declaration information will appear here.</p></CardContent></Card></TabsContent>
          <TabsContent value="voting_record"><Card className="shadow-sm"><CardHeader><CardTitle>Voting Record</CardTitle></CardHeader><CardContent><p className="text-muted-foreground italic py-4">Voting record details will appear here (if applicable).</p></CardContent></Card></TabsContent>
          <TabsContent value="edit_history"><Card className="shadow-sm"><CardHeader><CardTitle>Edit History</CardTitle></CardHeader><CardContent><p className="text-muted-foreground italic py-4">History of changes to this profile will appear here.</p></CardContent></Card></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
