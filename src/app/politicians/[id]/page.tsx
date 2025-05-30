
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
import type { DetailedPolitician, PoliticianPartyMembership, PoliticianParty, PoliticianMediaAsset } from '@/types/entities';


interface ModalContentData {
  fieldName: string;
  fieldLabel: string;
  currentValue: any;
  fieldType: ModalFieldType;
  editorComponent?: React.ComponentType<EditorProps<any>>;
  editorProps?: Record<string, any>;
  politicianId: string;
  fieldOptions?: string[]; // For select type
}

// PoliticianDetailPage - Main Component
export default function PoliticianDetailPage({ params: serverParamsProp }: { params: { id: string } }) {
  const resolvedServerParams = use(serverParamsProp);
  const id = resolvedServerParams.id;

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
      photo_asset_id,
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
        } else if (details.photo_asset_id) { // If photo_asset_id is directly on politician table
          const { data: mediaAssetForPhoto, error: mediaError } = await supabase
            .from('media_assets')
            .select('storage_path')
            .eq('id', details.photo_asset_id)
            .single();
          if (mediaAssetForPhoto?.storage_path) {
             const url = await getPublicUrlForMediaAsset(mediaAssetForPhoto.storage_path);
             setPhotoUrl(url);
          } else {
            console.warn("Photo asset ID found, but no corresponding media asset or storage path:", mediaError?.message);
            setPhotoUrl(null);
          }
        } else {
          setPhotoUrl(null);
        }
      } else {
        notFound();
      }
      setIsLoading(false);
    }
    loadData();
  }, [id, supabase]); // Added supabase to dependencies


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
                    <CardDescription>A summary including biography, education, and current political engagement.</CardDescription>
                  </div>
                   <div className="flex items-center gap-2">
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
                      <EditButton
                        onClick={() => openModal({
                            fieldName: 'education',
                            fieldLabel: 'Education',
                            currentValue: politician.education || '', // Assuming education is stored as JSON string
                            fieldType: 'textarea', // Or custom for structured education entries
                            politicianId: String(politician.id),
                        })}
                       className="static opacity-100"
                      />
                   </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Overview
                    biography={politician.bio}
                    education={politician.education}
                    currentPositionData={politician.politician_positions?.find(p => p.is_current)}
                    currentPartyData={politician.party_memberships?.find(pm => pm.is_active)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="career">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Career Timeline</CardTitle>
                   <EditButton
                        onClick={() => openModal({
                            fieldName: 'political_journey', // This field stores career entries
                            fieldLabel: 'Political Journey / Career Entries',
                            currentValue: politician.political_journey || [], // Assuming JSON string or array
                            fieldType: 'custom',
                            editorComponent: () => <p>Political Journey/Career Editor (to be implemented)</p>, // Placeholder
                            politicianId: String(politician.id),
                        })}
                        className="static opacity-100"
                    />
                </CardHeader>
                <CardContent className="pt-6">
                  <CareerTimeline politicalJourney={politician.political_journey ?? []} positions={politician.politician_positions ?? []} />
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
                            editorProps: { /* if any specific props are needed */ },
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
                            editorProps: { /* if any specific props are needed */ },
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
        fieldOptions={modalData.fieldOptions}
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
  const supabase = createSupabaseBrowserClient();
  const [partyLogoUrl, setPartyLogoUrl] = useState<string | null>(null);
  const activePartyMembership = politician.party_memberships?.find(pm => pm.is_active);

  useEffect(() => {
    const fetchPartyLogo = async () => {
      if (activePartyMembership?.parties?.logo?.storage_path) {
        const url = await getPublicUrlForMediaAsset(activePartyMembership.parties.logo.storage_path);
        setPartyLogoUrl(url);
      } else if (activePartyMembership?.parties?.logo_asset_id) {
         const { data: mediaAsset, error } = await supabase
            .from('media_assets')
            .select('storage_path')
            .eq('id', activePartyMembership.parties.logo_asset_id)
            .single();
        if (mediaAsset?.storage_path) {
            const url = await getPublicUrlForMediaAsset(mediaAsset.storage_path);
            setPartyLogoUrl(url);
        }
      }
      else {
        setPartyLogoUrl(null);
      }
    };
    fetchPartyLogo();
  }, [activePartyMembership, supabase]);


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
    fieldType?: ModalFieldType,
    fieldName?: string,
    editorComponent?: React.ComponentType<EditorProps<any>>,
    editorProps?: Record<string, any>,
    fieldOptions?: string[]
  ) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return null;
    }
    const displayValue = String(value);

    return (
      <div className="relative group/field flex items-start text-sm text-gray-700 dark:text-gray-300 mb-1.5">
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
        {fieldName && fieldType && (
          <EditButton
            onClick={() => onOpenModal({
              fieldName,
              fieldLabel: label,
              currentValue: politician[fieldName as keyof DetailedPolitician] ?? '',
              fieldType,
              editorComponent,
              editorProps,
              fieldOptions, // Pass options for select type
              politicianId: String(politician.id),
            })}
          />
        )}
      </div>
    );
  };

  const renderSocialLink = (platformKey: 'twitter_handle' | 'facebook_profile_url', value?: string | null, fieldName?: string) => {
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
      <div className="relative group/field flex items-center">
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${politician.name}'s ${platformName} profile`}
           className="text-muted-foreground hover:text-primary p-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors">
            <IconComponent className="h-5 w-5" />
        </a>
        {fieldName && (
          <EditButton
            onClick={() => onOpenModal({
                fieldName,
                fieldLabel: platformName,
                currentValue: value,
                fieldType: 'url',
                politicianId: String(politician.id),
            })}
            className="ml-1"
          />
        )}
      </div>
    );
  };


  return (
    <header className="relative group flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
      <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full overflow-hidden shadow-xl border-4 border-white dark:border-gray-800 flex-shrink-0">
        <div className="absolute top-1 right-1 z-10">
            <EditButton
              onClick={() => onOpenModal({
                fieldName: 'photo_asset_id',
                fieldLabel: 'Profile Photo',
                currentValue: politician.photo_asset_id || (politician.media_assets as PoliticianMediaAsset | null)?.storage_path || '',
                fieldType: 'custom', // Needs a custom photo uploader component
                editorComponent: () => <p>Photo editing UI (e.g., PhotoUpload component) goes here.</p>,
                politicianId: String(politician.id),
              })}
              className="bg-white/70 hover:bg-white rounded-full p-0.5"
            />
        </div>
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={`Photo of ${politician.name}`}
            fill
            sizes="(max-width: 768px) 144px, 192px"
            className="object-cover"
            priority
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400.png'; }}
            data-ai-hint="politician photo"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-full">
            <User className="w-24 h-24 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>
      <div className="text-center md:text-left pt-2 flex-grow">
        <div className="relative group/field inline-block">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{politician.name}</h1>
            <EditButton
                onClick={() => onOpenModal({
                    fieldName: 'name',
                    fieldLabel: 'Name (English)',
                    currentValue: politician.name || '',
                    fieldType: 'text',
                    politicianId: String(politician.id),
                })}
            />
        </div>
        {politician.name_nepali && (
          <div className="relative group/field inline-block">
            <p className="text-xl text-muted-foreground dark:text-gray-400 mt-1">{politician.name_nepali}</p>
             <EditButton
                onClick={() => onOpenModal({
                    fieldName: 'name_nepali',
                    fieldLabel: 'Name (Nepali)',
                    currentValue: politician.name_nepali || '',
                    fieldType: 'text',
                    politicianId: String(politician.id),
                })}
            />
          </div>
        )}

        {activePartyMembership && activePartyMembership.parties && (
          <div className="relative group/field mt-3 mb-3 p-3 bg-muted/30 dark:bg-muted/10 rounded-md inline-block">
            <div className="flex items-center gap-2">
              {partyLogoUrl ? (
                <Image src={partyLogoUrl} alt={`${activePartyMembership.parties.name} logo`} width={24} height={24} className="rounded-sm" data-ai-hint="party logo small"/>
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
                    fieldType: 'custom',
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
          {renderHeaderField("Date of Birth (AD)", politician.dob ? new Date(politician.dob).toLocaleDateString() : null, <Cake />, false, 'custom', 'dob', DateEditor)}
          {renderHeaderField("Date of Birth (BS)", politician.dob_bs, <Cake />, false, 'custom', 'dob_bs', DateEditor, { isBSDate: true })}
          {renderHeaderField("Gender", politician.gender, <VenetianMask />, false, 'select', 'gender', undefined, undefined, ['Male', 'Female', 'Other', 'PreferNotToSay'])}
          {renderHeaderField("Email", politician.contact_email, <Mail />, true, 'text', 'contact_email')}
          {renderHeaderField("Phone", politician.contact_phone, <Phone />, false, 'text', 'contact_phone')}
          {renderHeaderField("Permanent Address", politician.permanent_address, <MapPin />, false, 'textarea', 'permanent_address')}
          {renderHeaderField("Current Address", politician.current_address, <MapPin />, false, 'textarea', 'current_address')}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
          <div className="flex items-center space-x-2">
            {renderSocialLink('twitter_handle', politician.twitter_handle, 'twitter_handle')}
            {renderSocialLink('facebook_profile_url', politician.facebook_profile_url, 'facebook_profile_url')}
            {/* Add Instagram or other social links similarly */}
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

    