
"use client"; // Make this a client component

// src/app/politicians/[id]/page.tsx
import React, { useState, useEffect } from 'react';
// Use client-side Supabase instance for client-side fetching
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getPublicUrlForMediaAsset } from '@/lib/uploadUtils';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast'; // Corrected import path
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
import type { DetailedPolitician, PoliticianCareerEntry } from '@/types/entities';


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

// PoliticianProfilePage - Main Component
export default function PoliticianDetailPage({ params: serverParams }: { params: { id: string } }) {
  const clientParams = useParams();
  const id = serverParams.id || (clientParams.id as string);

  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [politician, setPolitician] = useState<DetailedPolitician | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowed, setIsFollowed] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Partial<ModalContentData>>({});

  const [activeTab, setActiveTab] = useState("overview");


  async function getPoliticianDetails(politicianId: string): Promise<DetailedPolitician | null> {
    if (!politicianId || isNaN(Number(politicianId))) {
        console.error('Invalid politician ID:', politicianId);
        return null;
    }

    const numericId = Number(politicianId);

    const baseSelect = `
      id,
      name,
      name_nepali,
      is_independent,
      dob,
      dob_bs,
      gender,
      bio,
      education,
      political_journey,
      public_criminal_records,
      asset_declarations,
      twitter_handle,
      facebook_profile_url,
      contact_email,
      contact_phone,
      permanent_address,
      current_address,
      province_id,
      created_at,
      updated_at,
      media_assets!politicians_photo_asset_id_fkey ( storage_path ),
      party_memberships (
        *,
        parties (
          *,
          logo:media_assets!parties_logo_asset_id_fkey ( storage_path )
        )
      ),
      politician_positions (
        *,
        position_titles ( * )
      ),
      bill_votes!politician_id ( *, legislative_bills ( * ) ),
      promises!politician_id ( * )
    `;
    // politician_career_entries!politician_id ( * ) - removed due to persistent schema error

    try {
        // Initial attempt to fetch with career entries
        let { data, error } = await supabase
            .from('politicians')
            .select(`${baseSelect}, politician_career_entries!politician_id ( * )`)
            .eq('id', numericId)
            .maybeSingle<DetailedPolitician>();

        if (error) {
            console.error('Error fetching politician details (initial attempt):', error.message, error.details);
            // Check if the error is specifically about 'politician_career_entries' relationship
            if (error.message.includes("Could not find a relationship between 'politicians' and 'politician_career_entries'")) {
                console.warn("Fallback: Retrying query without 'politician_career_entries' due to relationship error.");
                const fallbackQuery = await supabase
                    .from('politicians')
                    .select(baseSelect) // Fetch without career entries
                    .eq('id', numericId)
                    .maybeSingle<Omit<DetailedPolitician, 'politician_career_entries'>>();

                if (fallbackQuery.error) {
                    console.error('Error fetching politician details (fallback):', fallbackQuery.error.message, fallbackQuery.error.details);
                    return null;
                }
                if (fallbackQuery.data) {
                    // Manually fetch career_entries if main data fetch was successful
                    const { data: careerData, error: careerError } = await supabase
                        .from('politician_career_entries')
                        .select('*')
                        .eq('politician_id', numericId);

                    if (careerError) {
                        console.warn('Failed to fetch career entries in fallback:', careerError.message);
                        return { ...fallbackQuery.data, politician_career_entries: [] } as DetailedPolitician; // Return main data with empty career entries
                    }
                    return { ...fallbackQuery.data, politician_career_entries: careerData || [] } as DetailedPolitician;
                }
                return null; // Fallback also failed or returned no data
            }
            // If error is not related to career_entries, return null
            return null;
        }
        return data;

    } catch (e: any) {
        console.error('Unexpected error in getPoliticianDetails:', e.message);
        return null;
    }
}


  useEffect(() => {
    async function loadData() {
      if (!id) {
        setIsLoading(false);
        notFound();
        return;
      }
      setIsLoading(true);
      const details = await getPoliticianDetails(id);

      if (details) {
        setPolitician(details);
        if (details.media_assets?.storage_path) {
          const url = await getPublicUrlForMediaAsset(String(details.media_assets.storage_path)); // Assuming storage_path can be used directly with assetId as argument
          setPhotoUrl(url);
        } else if (details.photo_asset_id) { // Fallback if media_assets relationship isn't used but photo_asset_id is direct
          const url = await getPublicUrlForMediaAsset(String(details.photo_asset_id));
          setPhotoUrl(url);
        } else {
          setPhotoUrl(null);
        }
      } else {
        notFound();
      }
      setIsLoading(false);
    }
    loadData();
  }, [id]);


  const openModal = (data: ModalContentData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to propose an edit.",
        variant: "destructive",
      });
      return;
    }
    if (!politician) {
      toast({
        title: "Data Error",
        description: "Politician data is not yet available. Please try again shortly.",
        variant: "destructive",
      });
      return;
    }
    setModalData({ ...data, politicianId: String(politician.id) });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData({});
    // Optionally, re-fetch politician data here if an edit was made
  };

  const renderField = (
    label: string,
    value?: string | number | null,
    icon?: React.ReactNode,
    isLink: boolean = false,
    fieldName?: keyof DetailedPolitician | string, // Allow string for nested paths
    fieldType: ModalFieldType = 'text',
    editorProps: Record<string, any> = {}
  ) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      if (!fieldName) return null;
    }

    const displayValue = (value === undefined || value === null || String(value).trim() === '')
      ? <span className="italic text-muted-foreground">Not set</span>
      : String(value);

    // Nested value access for currentValue in modal
    let actualCurrentValue = currentValue;
    if (politician && typeof fieldName === 'string' && fieldName.includes('.')) {
        actualCurrentValue = fieldName.split('.').reduce((obj: any, key) => obj?.[key], politician);
    } else if (politician && fieldName) {
        actualCurrentValue = (politician as any)[fieldName];
    }


    return (
      <div className="relative group flex items-start text-sm text-gray-700 dark:text-gray-300 mb-1.5">
        {icon && React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" })}
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
              fieldName: String(fieldName),
              fieldLabel: label,
              currentValue: actualCurrentValue ?? value ?? '',
              fieldType,
              editorProps,
              politicianId: String(politician.id),
            })}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100"
          />
        )}
      </div>
    );
  };

  const renderSocialLink = (platformKey: keyof NonNullable<PoliticianFormData['social_media_handles']>, url?: string | null) => {
    if (!url || !politician) return null;
    let IconComponent: React.ElementType = Globe;
    let platformName = platformKey.charAt(0).toUpperCase() + platformKey.slice(1);

    switch (platformKey) {
      case 'twitter': IconComponent = Twitter; platformName = "Twitter"; break;
      case 'facebook': IconComponent = Facebook; platformName = "Facebook"; break;
      case 'instagram': IconComponent = Instagram; platformName = "Instagram"; break;
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
      text: `Check out the profile of ${politician?.name || 'this politician'} on Netrika!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: "Shared successfully!" });
      } else {
        throw new Error("Web Share API not available.");
      }
    } catch (err) {
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
    return <div className="container mx-auto p-4 py-8 text-center">Loading politician profile...</div>;
  }
  
  const getNestedValue = (obj: any, path: string) => {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  return (
    <>
      <div className="container mx-auto p-4 py-8 md:py-12 max-w-5xl">
      <ProfileHeader politician={politician} photoUrl={photoUrl} onOpenModal={openModal} />

        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 text-center sr-only">Detailed Information</h2>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 mb-6 bg-gray-100 dark:bg-gray-800/40 p-1 rounded-md">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="career" className="text-xs sm:text-sm">Career</TabsTrigger>
              <TabsTrigger value="criminal_records" className="text-xs sm:text-sm">Criminal Records</TabsTrigger>
              <TabsTrigger value="assets" className="text-xs sm:text-sm">Assets</TabsTrigger>
              {/* <TabsTrigger value="voting_record" className="text-xs sm:text-sm">Voting Record</TabsTrigger> */}
              <TabsTrigger value="edit_history" className="text-xs sm:text-sm">Edit History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Overview</CardTitle>
                    <CardDescription>A summary including biography and current political engagement.</CardDescription>
                  </div>
                  <EditButton
                    onClick={() => openModal({
                      fieldName: 'bio',
                      fieldLabel: 'Biography',
                      currentValue: politician.bio || '',
                      fieldType: 'richtext',
                      editorComponent: RichTextEditor,
                      politicianId: String(politician.id),
                    })}
                   className="static opacity-100" // Override default absolute positioning and hover for this button
                  />
                </CardHeader>
                <CardContent className="pt-6">
                  <Overview
                    biography={politician.bio}
                    politicalJourney={politician.political_journey}
                    currentPositionData={politician.politician_positions?.find(p => p.is_current)}
                    currentPartyData={politician.party_memberships?.find(pm => pm.is_active)}
                  />
                   <div className="mt-4 text-right">
                     <EditButton
                        onClick={() => openModal({
                            fieldName: 'political_journey',
                            fieldLabel: 'Political Journey',
                            currentValue: politician.political_journey || [], // Assuming it's an array or string that can be edited as such
                            fieldType: 'custom', // This will need a custom editor component
                            editorComponent: () => <p>Political Journey JSON/Array Editor (to be implemented)</p>,
                            politicianId: String(politician.id),
                        })}
                        className="static opacity-100"
                      />
                   </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="career">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Career Timeline</CardTitle>
                   <EditButton
                        onClick={() => openModal({
                            fieldName: 'politician_career_entries',
                            fieldLabel: 'Career Entries',
                            currentValue: politician.politician_career_entries || [],
                            fieldType: 'custom', // Needs custom editor
                            editorComponent: () => <p>Career Entries Editor (to be implemented)</p>,
                            politicianId: String(politician.id),
                        })}
                        className="static opacity-100"
                    />
                </CardHeader>
                <CardContent className="pt-6">
                  <CareerTimeline careerEntries={politician.politician_career_entries ?? []} positions={politician.politician_positions ?? []} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="criminal_records">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Criminal Records</CardTitle>
                    <CardDescription>Information related to any reported criminal records.</CardDescription>
                  </div>
                   <EditButton
                       onClick={() => openModal({
                            fieldName: 'public_criminal_records',
                            fieldLabel: 'Criminal Records',
                            currentValue: politician.public_criminal_records || [], // This might be a string or an array
                            fieldType: 'custom',
                            editorComponent: CriminalRecordEditor, // Using this, it expects an array of CriminalRecord
                            politicianId: String(politician.id),
                        })}
                       className="static opacity-100"
                    />
                </CardHeader>
                <CardContent className="pt-6">
                  <CriminalRecords criminalRecordsData={politician.public_criminal_records} />
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
                    <EditButton
                       onClick={() => openModal({
                            fieldName: 'asset_declarations',
                            fieldLabel: 'Asset Declarations',
                            currentValue: politician.asset_declarations || [], // This might be a string or an array
                            fieldType: 'custom',
                            editorComponent: AssetDeclarationEditor, // This expects array of AssetDeclaration
                            politicianId: String(politician.id),
                        })}
                       className="static opacity-100"
                    />
                </CardHeader>
                <CardContent className="pt-6">
                  <AssetDeclarations assetDeclarationsData={politician.asset_declarations} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* <TabsContent value="voting_record">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Voting Record</CardTitle>
                  <CardDescription>Details of votes on legislative bills (if applicable).</CardDescription>
                </CardHeader>
                <CardContent>
                  <VotingHistory billVotes={politician.bill_votes ?? []} />
                </CardContent>
              </Card>
            </TabsContent> */}

            <TabsContent value="edit_history">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Edit History</CardTitle>
                  <CardDescription>Chronological list of approved changes to this profile.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EditHistory politicianId={String(politician.id)} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <EditModal
        isOpen={isModalOpen}
        onClose={closeModal}
        politicianId={politician?.id ? String(politician.id) : ''}
        fieldName={modalData.fieldName || ''}
        fieldLabel={modalData.fieldLabel || ''}
        currentValue={modalData.currentValue}
        fieldType={modalData.fieldType as ModalFieldType}
        editorComponent={modalData.editorComponent}
        editorProps={modalData.editorProps}
        isAdmin={user?.role === 'Admin'}
      />
    </>
  );
}


// Sub-component for Profile Header for better organization
interface ProfileHeaderProps {
  politician: DetailedPolitician;
  photoUrl: string | null;
  onOpenModal: (data: ModalContentData) => void;
}
function ProfileHeader({ politician, photoUrl, onOpenModal }: ProfileHeaderProps) {
  const { user } = useAuth();
  const { toast } = useToast(); // For follow/share toast notifications
  const [isFollowed, setIsFollowed] = useState(false); // Placeholder

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
      text: `Check out the profile of ${politician?.name || 'this politician'} on Netrika!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: "Shared successfully!" });
      } else {
        throw new Error("Web Share API not available.");
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link Copied!", description: "Profile link copied to clipboard." });
      } catch (copyError) {
        toast({ title: "Share Failed", description: "Could not share or copy link.", variant: "destructive" });
      }
    }
  };

  const renderSocialLink = (platformKey: 'twitter_handle' | 'facebook_profile_url', value?: string | null) => {
    if (!value) return null;
    let IconComponent: React.ElementType = Globe;
    let href = value;
    let platformName = '';

    if (platformKey === 'twitter_handle' && value) {
        IconComponent = Twitter;
        href = `https://twitter.com/${value.replace('@', '')}`;
        platformName = 'Twitter';
    } else if (platformKey === 'facebook_profile_url' && value) {
        IconComponent = Facebook;
        href = value; // Assuming full URL
        platformName = 'Facebook';
    } else {
        return null; // Or handle other platforms like Instagram if added
    }

    return (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${politician.name}'s ${platformName} profile`}
           className="text-muted-foreground hover:text-primary p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors">
            <IconComponent className="h-5 w-5" />
        </a>
    );
  };

  return (
    <header className="relative group flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
      <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full overflow-hidden shadow-xl border-4 border-white dark:border-gray-800 flex-shrink-0">
        <EditButton
          onClick={() => onOpenModal({
            fieldName: 'photo_asset_id',
            fieldLabel: 'Profile Photo',
            currentValue: politician.photo_asset_id || '',
            fieldType: 'custom',
            editorComponent: () => <p>Photo editing UI to be implemented here. (e.g. using PhotoUpload component)</p>,
            politicianId: String(politician.id),
          })}
          className="absolute top-1 right-1 z-10 bg-white/70 hover:bg-white rounded-full p-0.5"
        />
        {photoUrl ? (
          <Image
            src={photoUrl}
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
        <div className="relative group/name-field">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{politician.name}</h1>
          <EditButton
            onClick={() => onOpenModal({
              fieldName: 'name', fieldLabel: 'Full Name', currentValue: politician.name, fieldType: 'text', politicianId: String(politician.id),
            })}
          />
        </div>
        {politician.name_nepali && (
          <div className="relative group/name-nepali-field">
            <p className="text-xl text-muted-foreground dark:text-gray-400 mt-1">{politician.name_nepali}</p>
            <EditButton
              onClick={() => onOpenModal({
                fieldName: 'name_nepali', fieldLabel: 'Nepali Name', currentValue: politician.name_nepali || '', fieldType: 'text', politicianId: String(politician.id),
              })}
            />
          </div>
        )}
        <div className="mt-4 space-y-1.5">
          {renderField("Date of Birth (AD)", politician.dob ? new Date(politician.dob).toLocaleDateString() : null, <Cake />, false, 'dob', 'date', { editorProps: { isBSDate: false }})}
          {renderField("Date of Birth (BS)", politician.dob_bs, <Cake />, false, 'dob_bs', 'date', { editorProps: { isBSDate: true }})}
          {renderField("Gender", politician.gender, <VenetianMask />, false, 'gender', 'select', { editorProps: { options: ['Male', 'Female', 'Other', 'Prefer not to say'] }})}
          {renderField("Email", politician.contact_email, <Mail />, true, 'contact_email', 'text')}
          {renderField("Phone", politician.contact_phone, <Phone />, false, 'contact_phone', 'text')}
          {renderField("Permanent Address", politician.permanent_address, <MapPin />, false, 'permanent_address', 'textarea')}
          {renderField("Current Address", politician.current_address, <MapPin />, false, 'current_address', 'textarea')}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
          <div className="flex items-center space-x-1">
            {renderSocialLink('twitter_handle', politician.twitter_handle)}
            {renderSocialLink('facebook_profile_url', politician.facebook_profile_url)}
            {/* Add Instagram if you add politician.instagram_handle to your schema */}
          </div>
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
  );
}


    