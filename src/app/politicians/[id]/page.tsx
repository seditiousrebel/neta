"use client"; // Make this a client component

// src/app/politicians/[id]/page.tsx
import React, { useState, useEffect } from 'react';
// Use client-side Supabase instance for client-side fetching
import { supabase } from '@/lib/supabase/client'; 
import { getPublicUrlForMediaAsset } from '@/lib/uploadUtils';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { 
  User, Cake, VenetianMask, Info, Twitter, Facebook, Instagram, Globe, Mail, Phone, MapPin,
  Heart, Share2, AlertTriangle // Added new icons
} from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
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

// Import new components for tabs
import AssetDeclarations from '@/components/politicians/profile/AssetDeclarations';
import EditHistory from '@/components/politicians/profile/EditHistory';
import VotingHistory from '@/components/politicians/detail/VotingHistory';


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

  const { user } = useAuth(); // Get user from auth context
  const { toast } = useToast(); // For showing notifications
  // const router = useRouter(); // Uncomment if redirection to login is implemented

  const [politician, setPolitician] = useState<PoliticianProfileData | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowed, setIsFollowed] = useState(false); // State for follow button

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Partial<ModalContentData>>({});

  useEffect(() => {
    // Client-side data fetching or re-fetching after edits.
    // For initial load, we can use the server-fetched data if available (passed as props)
    // or fetch fresh data here.
    // This example will fetch fresh data on mount.
    async function loadData() {
      setIsLoading(true);
      // Using the imported client-side 'supabase' instance
      const { data: fetchedPol, error: politicianError } = await supabase
        .from('politicians')
        .select('*')
        .eq('id', id)
        .single();

      if (politicianError) {
        console.error("Failed to fetch politician data on client:", politicianError.message);
        // Check for specific error code that indicates "not found" if PGRST116 is standard
        if (politicianError.code === 'PGRST116') {
            notFound();
        } else {
            // Handle other errors (e.g., show a generic error message to the user)
            // For now, we'll still call notFound(), but a more user-friendly error page might be better.
            notFound(); 
        }
        setIsLoading(false);
        return;
      }
      
      if (fetchedPol) {
        const typedPol = fetchedPol as PoliticianProfileData;
        typedPol.id = String(typedPol.id); // Ensure ID is string
        setPolitician(typedPol);

        if (typedPol.photo_asset_id) {
          const url = await getPublicUrlForMediaAsset(typedPol.photo_asset_id);
          setPhotoUrl(url); // url can be null if not found or error, handled by Image onError
        } else {
          setPhotoUrl(null); // No asset ID, so no photo
        }
      } else {
         // This case should ideally be caught by politicianError.code === 'PGRST116'
        console.warn("Politician data not found for id:", id);
        notFound(); 
      }
      setIsLoading(false);
    }
    
    if (id) { // Ensure id is available before loading
        loadData();
    } else {
        // Handle case where id might not be available immediately (e.g. if clientParams was slow)
        // Though with serverParams.id, this should usually be present.
        setIsLoading(false);
        notFound(); // Or some other error state
    }
  }, [id]);


  const openModal = (data: ModalContentData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to propose an edit.",
        variant: "destructive", // Or "info"
      });
      // Optionally: router.push('/auth/login'); // If using redirection
      return;
    }
    // Ensure politician data is loaded before trying to access politician.id
    if (!politician) {
        toast({
            title: "Data Error",
            description: "Politician data is not yet available. Please try again shortly.",
            variant: "destructive",
        });
        return;
    }
    setModalData({ ...data, politicianId: politician.id });
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

  const handleFollow = () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to follow politicians.", variant: "info" });
      return;
    }
    setIsFollowed(!isFollowed);
    toast({ title: isFollowed ? "Unfollowed (Placeholder)" : "Followed (Placeholder)", description: "Follow functionality to be implemented." });
  };

  const handleShare = async () => {
    const shareData = {
      title: politician?.name || "Politician Profile",
      text: `Check out the profile of ${politician?.name || 'this politician'} on [Your Site Name]!`, // Replace [Your Site Name]
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: "Shared successfully!" });
      } else {
        throw new Error("Web Share API not available."); // Fallback to clipboard
      }
    } catch (err) {
      // Fallback to copying link to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link Copied!", description: "Profile link copied to clipboard." });
      } catch (copyError) {
        toast({ title: "Share Failed", description: "Could not share or copy link.", variant: "destructive" });
      }
    }
  };

  const handleReportInfo = () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to report information.", variant: "info" });
      return;
    }
    toast({
      title: "Report (Placeholder)",
      description: "Report functionality to be implemented. Please contact support for urgent issues.",
      duration: 5000,
    });
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
            
            {/* Social Media and Engagement Buttons Container */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
              {/* Social Media Icons */}
              <div className="flex items-center space-x-1">
                {(politician.social_media_handles && Object.values(politician.social_media_handles).some(h => h)) && (
                    Object.entries(politician.social_media_handles)
                        .filter(([,url]) => url)
                        .map(([platform, url]) => renderSocialLink(platform as keyof NonNullable<PoliticianFormData['social_media_handles']>, url))
                )}
              </div>

              {/* Engagement Buttons */}
              <div className="flex items-center space-x-2 mt-3 sm:mt-0 sm:ml-4">
                <Button variant={isFollowed ? "default" : "outline"} size="sm" onClick={handleFollow} className="group">
                  <Heart className={`h-4 w-4 mr-2 transition-colors ${isFollowed ? "fill-destructive text-destructive" : "text-muted-foreground group-hover:text-destructive"}`} />
                  {isFollowed ? "Following" : "Follow"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  Share
                </Button>
              </div>
            </div>
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
                  <AssetDeclarations assetDeclarationsData={politician.asset_declarations} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="voting_record">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Voting Record</CardTitle>
                  <CardDescription>Details of votes on legislative bills (if applicable).</CardDescription>
                </CardHeader>
                <CardContent>
                  <VotingHistory politicianId={politician.id} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="edit_history">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Edit History</CardTitle>
                  <CardDescription>Chronological list of approved changes to this profile.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EditHistory politicianId={politician.id} />
                </CardContent>
              </Card>
            </TabsContent>
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
        editorProps={modalData.editorProps} // Pass through editorProps
        isAdmin={user?.role === 'Admin'} // Pass isAdmin based on user role
      />
    </>
  );
}
