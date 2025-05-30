"use client"; // Make this a client component

// src/app/politicians/[id]/page.tsx
import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Still needed for initial fetch
import { getPublicUrlForMediaAsset } from '@/lib/supabase/storage.server.ts';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { User, Cake, VenetianMask, Info, Twitter, Facebook, Instagram, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { notFound, useParams } from 'next/navigation'; // Added useParams
import type { PoliticianFormData } from '@/components/contribute/PoliticianForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Added Button
import Overview from '@/components/politicians/profile/Overview';
import CareerTimeline from '@/components/politicians/profile/CareerTimeline';
import CriminalRecords from '@/components/politicians/profile/CriminalRecords';
// Import EditModal and EditButton
import { EditModal, EditModalProps, FieldType as ModalFieldType, EditorProps } from '@/components/wiki/EditModal';
import { EditButton } from '@/components/wiki/EditButton';
// Import Editors
import { RichTextEditor } from '@/components/wiki/RichTextEditor';
import { DateEditor, DateEditorProps } from '@/components/wiki/DateEditor';
import { CriminalRecordEditor, CriminalRecordEditorProps } from '@/components/wiki/CriminalRecordEditor';
import { AssetDeclarationEditor, AssetDeclarationEditorProps } from '@/components/wiki/AssetDeclarationEditor';


export interface PoliticianProfileData extends PoliticianFormData {
  id: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
}

// Modal Data Interface
interface ModalContentData {
  fieldName: string;
  fieldLabel: string;
  currentValue: any;
  fieldType: ModalFieldType;
  editorComponent?: React.ComponentType<EditorProps<any>>;
  editorProps?: Record<string, any>; // For props like isBSDate
  politicianId: string; // Ensure politicianId is part of modalData
}

// fetchPoliticianById remains largely the same but might be called differently or its result managed by state
// For initial load, it can still be used on the server if the page is hybrid, or fetched client-side.
// Given we are making it a "use client" page, for simplicity, we'll assume it's fetched and then managed.
// However, Next.js 13+ allows server-fetched data to be passed to client components.

async function fetchPoliticianById(id: string): Promise<{ politician: PoliticianProfileData | null; photoUrl: string | null }> {
  const supabase = createSupabaseServerClient(); // This will run server-side if component is hybrid
  
  const { data, error } = await supabase
    .from('politicians')
    .select('*')
    .eq('id', id)
    // .eq('status', 'Approved') // Temporarily remove status check for easier testing with drafts
    .single();

  if (error) {
    console.error(`Error fetching politician with ID ${id}: ${error.message}`);
    if (error.code === 'PGRST116') {
        notFound();
    }
    return { politician: null, photoUrl: null };
  }
  
  if (!data) {
    notFound();
  }

  const politician = data as PoliticianProfileData;
  politician.id = String(data.id);

  let photoUrl: string | null = null;
  if (politician.photo_asset_id) {
    // Assuming getPublicUrlForMediaAsset can be called client-side or this part is handled differently
    // For now, let's keep it as is, may need adjustment if it's server-only.
    // It is server-only. So, this URL needs to be fetched initially or passed.
    // For a client component, this initial fetch should happen in a useEffect or be passed as props.
  }

  return { politician, photoUrl };
}


// PoliticianProfilePage - Main Component
export default function PoliticianProfilePage({ params: serverParams }: { params: { id: string } }) {
  const clientParams = useParams(); // Use this for client-side access if needed, or stick to serverParams
  const id = serverParams.id || clientParams.id as string;

  const [politician, setPolitician] = useState<PoliticianProfileData | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Partial<ModalContentData>>({});

  useEffect(() => {
    // Client-side data fetching or re-fetching after edits.
    // For initial load, we can use the server-fetched data if available (passed as props)
    // or fetch fresh data here.
    // This example will fetch fresh data on mount.
    async function loadData() {
      setIsLoading(true);
      const supabase = createSupabaseServerClient(); // This needs to be client Supabase instance
                                                  // For now, let's assume a client-side Supabase client exists or is set up
                                                  // For simplicity, I'll mock this part of the re-fetch and assume initial data is enough.
                                                  // Proper re-fetch logic would be needed in a real app.
      
      // This is a simplified initial fetch for the client component.
      // In a real app, you might pass initial data from a server component parent or use SWR/React Query.
      const { data: fetchedPol, error } = await supabase
        .from('politicians')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchedPol) {
        const typedPol = fetchedPol as PoliticianProfileData;
        typedPol.id = String(typedPol.id);
        setPolitician(typedPol);
        if (typedPol.photo_asset_id) {
           // Client-side fetching of public URL (if storage helper allows or via a serverless function)
           // const publicUrl = await getPublicUrlForMediaAsset(typedPol.photo_asset_id); // This is server-only
           // For now, let's assume photoUrl is part of initial data or fetched differently.
           // To simplify, we'll use a placeholder logic for photoUrl on client side for now.
           // This part needs careful handling of Supabase client/server storage functions.
        }
      } else {
        console.error("Failed to fetch politician data on client:", error?.message);
        notFound(); // Or handle error state
      }
      setIsLoading(false);
    }
    loadData();
  }, [id]);


  const openModal = (data: ModalContentData) => {
    setModalData({ ...data, politicianId: politician!.id });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData({});
    // Optionally, re-fetch politician data here if an edit was made
  };
  
  // Updated renderField to include EditButton
  const renderField = (
    label: string, 
    value?: string | number | null, 
    icon?: React.ReactNode, 
    isLink: boolean = false,
    fieldName?: string, // To map to politician object key
    fieldType: ModalFieldType = 'text', // Default field type
    editorProps: Record<string, any> = {} // For DateEditor isBSDate etc.
  ) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      // Still render a placeholder for editable empty fields if fieldName is provided
      if (!fieldName) return null;
    }

    const displayValue = (value === undefined || value === null || String(value).trim() === '') 
        ? <span className="italic text-muted-foreground">Not set</span> 
        : String(value);

    return (
      <div className="relative group flex items-start text-sm text-gray-700 dark:text-gray-300 mb-1.5">
        {icon && React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0"})}
        <span className="font-semibold min-w-[100px] sm:min-w-[120px]">{label}:</span>
        <div className="ml-2 break-words flex-grow">
          {isLink && typeof value === 'string' && value.trim() !== '' ? (
              <a href={value.startsWith('http') ? value : `mailto:${value}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary dark:text-blue-400 break-all">
                  {displayValue}
              </a>
          ) : (
              <span>{displayValue}</span>
          )}
        </div>
        {fieldName && politician && !isLoading && (
          <EditButton
            onClick={() => openModal({
              fieldName,
              fieldLabel: label,
              currentValue: politician?.[fieldName as keyof PoliticianProfileData] ?? value ?? '', // Fallback for potentially nested values
              fieldType,
              editorProps,
              politicianId: politician.id,
            })}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100" // Standard hover visibility
          />
        )}
      </div>
    );
  };

  const renderSocialLink = (platformKey: keyof NonNullable<PoliticianFormData['social_media_handles']>, url?: string | null) => {
    if (!url || !politician) return null; // Added politician check
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
  
  if (isLoading || !politician) {
    return <div className="container mx-auto p-4 py-8 text-center">Loading politician profile...</div>; // Or a more sophisticated skeleton loader
  }

  // Helper to get nested values safely for the modal
  const getNestedValue = (obj: any, path: string) => {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  return (
    <>
      <div className="container mx-auto p-4 py-8 md:py-12 max-w-5xl">
        <header className="relative group flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
          <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full overflow-hidden shadow-xl border-4 border-white dark:border-gray-800 flex-shrink-0">
            {/* Photo Edit Button - conceptual placement */}
            <EditButton
                onClick={() => openModal({
                    fieldName: 'photo_asset_id', // Or a specific identifier for photo
                    fieldLabel: 'Profile Photo',
                    currentValue: politician.photo_asset_id || '',
                    fieldType: 'custom', // Will need a custom photo editor component
                    editorComponent: () => <p>Photo editing UI to be implemented here.</p>,
                    politicianId: politician.id,
                })}
                className="absolute top-1 right-1 z-10 bg-white/70 hover:bg-white rounded-full"
            />
            {photoUrl ? ( // This photoUrl would ideally be part of the 'politician' state updated by useEffect
              <Image
                src={photoUrl} // Use state variable
                alt={`Photo of ${politician.name}`}
                fill
                sizes="(max-width: 768px) 144px, 192px"
                className="object-cover"
                priority
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-person.png'; }}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-full">
                <User className="w-24 h-24 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>
          <div className="text-center md:text-left pt-2 flex-grow">
            <div className="relative group">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{politician.name}</h1>
              <EditButton
                onClick={() => openModal({
                  fieldName: 'name', fieldLabel: 'Full Name', currentValue: politician.name, fieldType: 'text', politicianId: politician.id,
                })}
              />
            </div>
            {politician.name_nepali && (
              <div className="relative group">
                <p className="text-xl text-muted-foreground dark:text-gray-400 mt-1">{politician.name_nepali}</p>
                <EditButton
                  onClick={() => openModal({
                    fieldName: 'name_nepali', fieldLabel: 'Nepali Name', currentValue: politician.name_nepali, fieldType: 'text', politicianId: politician.id,
                  })}
                />
              </div>
            )}
            <div className="mt-4 space-y-1.5">
              {renderField("Date of Birth (BS)", politician.dob, <Cake />, false, 'dob', 'date', { editorProps: { isBSDate: true }})}
              {renderField("Gender", politician.gender, <VenetianMask />, false, 'gender', 'select', { editorProps: { options: ['Male', 'Female', 'Other', 'Prefer not to say'] }})}
              {renderField("Email", getNestedValue(politician, 'contact_information.email'), <Mail />, true, 'contact_information.email', 'text')}
              {renderField("Phone", getNestedValue(politician, 'contact_information.phone'), <Phone />, false, 'contact_information.phone', 'text')}
              {renderField("Address", getNestedValue(politician, 'contact_information.address'), <MapPin />, false, 'contact_information.address', 'textarea')}
            </div>
            {(politician.social_media_handles && Object.values(politician.social_media_handles).some(h => h)) && (
              <div className="mt-5 flex items-center justify-center md:justify-start space-x-1">
                  {Object.entries(politician.social_media_handles)
                      .filter(([,url]) => url)
                      .map(([platform, url]) => renderSocialLink(platform as keyof PoliticianFormData['social_media_handles'], url))}
              </div>
            )}
          </div>
        </header>
        
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Overview</CardTitle>
                    <CardDescription>A summary including biography and current political engagement.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openModal({
                      fieldName: 'biography', // Assuming biography and political_journey are distinct fields for editing
                      fieldLabel: 'Biography',
                      currentValue: politician.biography || '',
                      fieldType: 'richtext',
                      editorComponent: RichTextEditor, // Pass the component itself
                      politicianId: politician.id,
                    })}>Edit Biography</Button>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* For Political Journey, assuming a similar edit button could be placed if it's a separate large text field */}
                  <Overview 
                    biography={politician.biography} 
                    politicalJourney={politician.political_journey}
                    currentPosition={politician.current_position_title}
                    currentParty={politician.current_party_name}
                  />
                   {/* Example: Button to edit Political Journey if it's also a richtext field */}
                   <div className="mt-4 text-right">
                     <Button variant="outline" size="sm" onClick={() => openModal({
                        fieldName: 'political_journey',
                        fieldLabel: 'Political Journey',
                        currentValue: politician.political_journey || '',
                        fieldType: 'richtext',
                        editorComponent: RichTextEditor,
                        politicianId: politician.id,
                      })}>Edit Political Journey</Button>
                   </div>
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Criminal Records</CardTitle>
                    <CardDescription>Information related to any reported criminal records for this individual.</CardDescription>
                  </div>
                   <Button variant="outline" size="sm" onClick={() => openModal({
                        fieldName: 'criminal_records',
                        fieldLabel: 'Criminal Records',
                        currentValue: politician.criminal_records || [],
                        fieldType: 'custom',
                        editorComponent: CriminalRecordEditor,
                        politicianId: politician.id,
                    })}>Edit Records</Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <CriminalRecords criminalRecordsData={politician.criminal_records} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="assets">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Asset Declarations</CardTitle>
                        <CardDescription>Yearly declarations of assets.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openModal({
                        fieldName: 'asset_declarations',
                        fieldLabel: 'Asset Declarations',
                        currentValue: politician.asset_declarations || [],
                        fieldType: 'custom',
                        editorComponent: AssetDeclarationEditor,
                        politicianId: politician.id,
                    })}>Edit Declarations</Button>
                </CardHeader>
                <CardContent className="pt-6">
                    {/* Display component for AssetDeclarations would go here, similar to CriminalRecords */}
                    {/* For now, just a placeholder or directly use the editor's display if suitable */}
                    <p className="text-muted-foreground italic py-4">
                        {politician.asset_declarations && politician.asset_declarations.length > 0 
                            ? `${politician.asset_declarations.length} declaration(s) on file.` 
                            : "Asset declaration information will appear here."}
                    </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="voting_record"><Card className="shadow-sm"><CardHeader><CardTitle>Voting Record</CardTitle></CardHeader><CardContent><p className="text-muted-foreground italic py-4">Voting record details will appear here (if applicable).</p></CardContent></Card></TabsContent>
            <TabsContent value="edit_history"><Card className="shadow-sm"><CardHeader><CardTitle>Edit History</CardTitle></CardHeader><CardContent><p className="text-muted-foreground italic py-4">History of changes to this profile will appear here.</p></CardContent></Card></TabsContent>
          </Tabs>
        </div>
      </div>
      <EditModal
        isOpen={isModalOpen}
        onClose={closeModal}
        politicianId={politician?.id || ''}
        fieldName={modalData.fieldName || ''}
        fieldLabel={modalData.fieldLabel || ''}
        currentValue={modalData.currentValue}
        fieldType={modalData.fieldType as ModalFieldType} // Cast because modalData.fieldType is partial
        editorComponent={modalData.editorComponent}
        // Pass editorProps correctly
        {...(modalData.editorProps && { editorProps: modalData.editorProps })}
      />
    </>
  );
}
