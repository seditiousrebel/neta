
"use client"; 

import React, { useState, useEffect, use } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getPublicUrlForMediaAsset } from '@/lib/uploadUtils';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast'; 
import { useRouter, notFound } from 'next/navigation'; 
import { Badge } from '@/components/ui/badge';
import {
  User, Cake, VenetianMask, Info, Twitter, Facebook, Instagram, Globe, Mail, Phone, MapPin,
  Heart, Share2, AlertTriangle, Landmark, Building, Pencil
} from 'lucide-react';
import type { PoliticianFormData } from '@/components/contribute/PoliticianForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; 
import Overview from '@/components/politicians/profile/Overview';
import CareerTimeline from '@/components/politicians/detail/CareerTimeline'; 
import CriminalRecords from '@/components/politicians/profile/CriminalRecords';
import { EditModal, EditModalProps, FieldType as ModalFieldType, EditorProps } from '@/components/wiki/EditModal';
import { EditButton } from '@/components/wiki/EditButton';
import { RichTextEditor } from '@/components/wiki/RichTextEditor';
import { DateEditor, DateEditorProps } from '@/components/wiki/DateEditor';
import { CriminalRecordEditor, CriminalRecordEditorProps } from '@/components/wiki/CriminalRecordEditor';
import { AssetDeclarationEditor, AssetDeclarationEditorProps } from '@/components/wiki/AssetDeclarationEditor';
import AssetDeclarations from '@/components/politicians/profile/AssetDeclarations';
import EditHistory from '@/components/politicians/profile/EditHistory';
import VotingHistory from '@/components/politicians/detail/VotingHistory';
import type { DetailedPolitician, PoliticianPartyMembership, PoliticianParty } from '@/types/entities';


interface ModalContentData {
  fieldName: string;
  fieldLabel: string;
  currentValue: any;
  fieldType: ModalFieldType;
  editorComponent?: React.ComponentType<EditorProps<any>>;
  editorProps?: Record<string, any>; 
  politicianId: string; 
}

export default function PoliticianDetailPage({ params: serverParamsProp }: { params: { id: string } }) {
  const serverParams = use(serverParamsProp); 
  const id = serverParams.id; 

  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [politician, setPolitician] = useState<DetailedPolitician | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

    try {
        let { data, error } = await supabase
            .from('politicians')
            .select(`${baseSelect}, politician_career_entries!politician_id ( * )`)
            .eq('id', numericId)
            .maybeSingle<DetailedPolitician>();

        if (error) {
            console.error('Error fetching politician details (initial attempt):', error.message, error.details);
            if (error.message.includes("Could not find a relationship between 'politicians' and 'politician_career_entries'")) {
                console.warn("Fallback: Retrying query without 'politician_career_entries' due to relationship error.");
                const fallbackQuery = await supabase
                    .from('politicians')
                    .select(baseSelect) 
                    .eq('id', numericId)
                    .maybeSingle<Omit<DetailedPolitician, 'politician_career_entries'>>();

                if (fallbackQuery.error) {
                    console.error('Error fetching politician details (fallback):', fallbackQuery.error.message, fallbackQuery.error.details);
                    return null;
                }
                if (fallbackQuery.data) {
                    const { data: careerData, error: careerError } = await supabase
                        .from('politician_career_entries')
                        .select('*')
                        .eq('politician_id', numericId);

                    if (careerError) {
                        console.warn('Failed to fetch career entries in fallback:', careerError.message);
                        return { ...fallbackQuery.data, politician_career_entries: [] } as DetailedPolitician; 
                    }
                    return { ...fallbackQuery.data, politician_career_entries: careerData || [] } as DetailedPolitician;
                }
                return null; 
            }
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
          const url = await getPublicUrlForMediaAsset(String(details.media_assets.storage_path));
          setPhotoUrl(url);
        } else if ((details as any).photo_asset_id) { 
          const url = await getPublicUrlForMediaAsset(String((details as any).photo_asset_id));
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
  };
  

  if (isLoading || !politician) {
    return <div className="container mx-auto p-4 py-8 text-center">Loading politician profile...</div>;
  }
  
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
                   className="static opacity-100"
                  />
                </CardHeader>
                <CardContent className="pt-6">
                  <Overview
                    biography={politician.bio}
                    politicalJourney={politician.political_journey as any}
                    currentPositionData={politician.politician_positions?.find(p => p.is_current)}
                    currentPartyData={politician.party_memberships?.find(pm => pm.is_active)}
                  />
                   <div className="mt-4 text-right">
                     <EditButton
                        onClick={() => openModal({
                            fieldName: 'political_journey',
                            fieldLabel: 'Political Journey',
                            currentValue: politician.political_journey || [], 
                            fieldType: 'custom', 
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
                            fieldType: 'custom', 
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
                            currentValue: politician.public_criminal_records || [], 
                            fieldType: 'custom',
                            editorComponent: CriminalRecordEditor, 
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
                            currentValue: politician.asset_declarations || [], 
                            fieldType: 'custom',
                            editorComponent: AssetDeclarationEditor, 
                            politicianId: String(politician.id),
                        })}
                       className="static opacity-100"
                    />
                </CardHeader>
                <CardContent className="pt-6">
                  <AssetDeclarations assetDeclarationsData={politician.asset_declarations as any} />
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

interface ProfileHeaderProps {
  politician: DetailedPolitician;
  photoUrl: string | null;
  onOpenModal: (data: ModalContentData) => void;
}

function ProfileHeader({ politician, photoUrl, onOpenModal }: ProfileHeaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowed, setIsFollowed] = useState(false); 
  const supabase = createSupabaseBrowserClient(); // For fetching party logo URL client-side

  const resolvedParams = use(serverParams); // This line seems to be a leftover from a merge and is incorrect here. serverParams is not defined in this scope.
                                        // For ProfileHeader, we directly use the politician prop.

  const [partyLogoUrl, setPartyLogoUrl] = useState<string | null>(null);
  const activePartyMembership = politician.party_memberships?.find(pm => pm.is_active);

  useEffect(() => {
    const fetchPartyLogo = async () => {
      if (activePartyMembership?.parties?.logo?.storage_path) {
        const url = await getPublicUrlForMediaAsset(activePartyMembership.parties.logo.storage_path);
        setPartyLogoUrl(url);
      } else {
        setPartyLogoUrl(null);
      }
    };
    fetchPartyLogo();
  }, [activePartyMembership]);


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
  
  const renderHeaderField = (
    label: string,
    value?: string | number | null,
    icon?: React.ReactNode,
    isLink: boolean = false,
    fieldName?: keyof DetailedPolitician | string, // Field name for editing, no fieldName means no edit button
    fieldType: ModalFieldType = 'text',
    editorProps: Record<string, any> = {}
  ) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      if (!fieldName) return null; // Only return null if not editable and empty
    }

    const displayValue = (value === undefined || value === null || String(value).trim() === '')
      ? <span className="italic text-muted-foreground">Not set</span>
      : String(value);
    
    let actualCurrentValue: any = value;
    if (politician && typeof fieldName === 'string') {
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
        {/* EditButton is only rendered if fieldName is provided */}
        {fieldName && (
          <EditButton
            onClick={() => onOpenModal({
              fieldName: String(fieldName),
              fieldLabel: label,
              currentValue: actualCurrentValue ?? '',
              fieldType,
              editorProps,
              politicianId: String(politician.id),
            })}
          />
        )}
      </div>
    );
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
        href = value; 
        platformName = 'Facebook';
    } else {
        return null; 
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
            currentValue: (politician as any).photo_asset_id || politician.media_assets?.storage_path || '', 
            fieldType: 'custom',
            editorComponent: () => <p>Photo editing UI (e.g., PhotoUpload component) goes here.</p>,
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
        {/* Removed EditButton from name here */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{politician.name}</h1>
        {politician.name_nepali && (
            // Removed EditButton from nepali name here
            <p className="text-xl text-muted-foreground dark:text-gray-400 mt-1">{politician.name_nepali}</p>
        )}

        {/* Current Party Affiliation */}
        {activePartyMembership && activePartyMembership.parties && (
          <div className="relative group/party-field mt-3 mb-3 p-3 bg-muted/30 rounded-md inline-block">
            <div className="flex items-center gap-2">
              {partyLogoUrl ? (
                <Image src={partyLogoUrl} alt={`${activePartyMembership.parties.name} logo`} width={24} height={24} className="rounded-sm" />
              ) : (
                <Landmark className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <span className="font-semibold text-sm">{activePartyMembership.parties.name}</span>
                {activePartyMembership.parties.abbreviation && <span className="text-xs text-muted-foreground ml-1">({activePartyMembership.parties.abbreviation})</span>}
              </div>
            </div>
            <EditButton
                onClick={() => onOpenModal({
                    fieldName: 'party_memberships',
                    fieldLabel: 'Party Affiliation',
                    currentValue: politician.party_memberships || [],
                    fieldType: 'custom', // Needs custom editor for array of memberships
                    editorComponent: () => <p>Party Membership Editor (to be implemented)</p>,
                    politicianId: String(politician.id),
                })}
            />
          </div>
        )}
        {politician.is_independent && !activePartyMembership && (
             <Badge variant="secondary" className="mt-3 mb-3">Independent</Badge>
        )}


        <div className="mt-4 space-y-1.5">
          {/* Fields rendered without individual edit buttons by not passing fieldName */}
          {renderHeaderField("Date of Birth (AD)", politician.dob ? new Date(politician.dob).toLocaleDateString() : null, <Cake />)}
          {renderHeaderField("Date of Birth (BS)", politician.dob_bs, <Cake />)}
          {renderHeaderField("Gender", politician.gender, <VenetianMask />)}
          {renderHeaderField("Email", politician.contact_email, <Mail />, true)}
          {renderHeaderField("Phone", politician.contact_phone, <Phone />)}
          {renderHeaderField("Permanent Address", politician.permanent_address, <MapPin />)}
          {renderHeaderField("Current Address", politician.current_address, <MapPin />)}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
          <div className="flex items-center space-x-1">
            {renderSocialLink('twitter_handle', politician.twitter_handle)}
            {renderSocialLink('facebook_profile_url', politician.facebook_profile_url)}
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
            {/* Placeholder for a general "Edit Basic Info" button */}
            <Button variant="outline" size="sm" onClick={() => toast({title: "Edit Basic Info (Placeholder)", description: "Modal/page for editing multiple fields to be implemented."})}>
                <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
                Edit Info
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
