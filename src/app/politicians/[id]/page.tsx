
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { DetailedPolitician, PoliticianCareerEntry } from '@/types/entities'; // Ensure PoliticianCareerEntry is imported
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User, Briefcase, Landmark, Mail, Phone, Twitter, Facebook, Layers, FileText, CalendarDays, Target, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

import ProfileHeader from '@/components/politicians/detail/ProfileHeader';
import CurrentPosition from '@/components/politicians/detail/CurrentPosition';
import PartyAffiliation from '@/components/politicians/detail/PartyAffiliation';
import ContactInfo from '@/components/politicians/detail/ContactInfo';
import SocialMediaLinks from '@/components/politicians/detail/SocialMediaLinks';
import CareerTimeline from '@/components/politicians/detail/CareerTimeline';
import VotingHistory from '@/components/politicians/detail/VotingHistory';
import PromisesSection from '@/components/politicians/detail/PromisesSection';

async function getPoliticianDetails(id: string): Promise<DetailedPolitician | null> {
  const supabase = createSupabaseServerClient();
  
  const mainQueryFields = `
      id,
      name,
      name_nepali,
      is_independent,
      dob,
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
      media_assets ( storage_path ),
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

  const fullQueryFields = `${mainQueryFields}, politician_career_entries!politician_id ( * )`;

  let { data: politicianData, error } = await supabase
    .from('politicians')
    .select(fullQueryFields)
    .eq('id', id)
    .maybeSingle<DetailedPolitician>();

  if (error) {
    console.error('Error fetching politician details (initial attempt):', error.message, error.details);
    // Check if the error is specifically about 'politician_career_entries' relationship
    if (error.message.includes("Could not find a relationship between 'politicians' and 'politician_career_entries'")) {
      console.warn("Fallback: Retrying query without 'politician_career_entries' due to relationship error.");
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('politicians')
        .select(mainQueryFields) // Query without politician_career_entries
        .eq('id', id)
        .maybeSingle<Omit<DetailedPolitician, 'politician_career_entries'>>();

      if (fallbackError) {
        console.error('Error fetching politician details (fallback attempt):', fallbackError.message, fallbackError.details);
        return null;
      }
      if (fallbackData) {
        // Attempt to fetch career entries separately
        const { data: careerEntries, error: careerError } = await supabase
          .from('politician_career_entries')
          .select('*')
          .eq('politician_id', id);

        if (careerError) {
          console.warn("Could not fetch career entries separately:", careerError.message);
        }
        // Merge results
        politicianData = {
          ...fallbackData,
          politician_career_entries: (careerEntries as PoliticianCareerEntry[] | null) || [], // Ensure it's an array
        };
        // Clear the original error since we have fallback data
        error = null; 
      } else {
        return null; // Politician not found even with fallback
      }
    } else {
      return null; // Different error, return null
    }
  }
  return politicianData || null; // return data if no error or if fallback succeeded
}

export default async function PoliticianDetailPage({ params }: { params: { id: string } }) {
  const politicianId = params.id;
  if (!/^\d+$/.test(politicianId)) {
    console.error(`Invalid politician ID format: ${politicianId}`);
    notFound();
  }
  
  const politician = await getPoliticianDetails(politicianId);

  if (!politician) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <ProfileHeader politician={politician} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="career">Career</TabsTrigger>
          <TabsTrigger value="voting">Voting Record</TabsTrigger>
          <TabsTrigger value="promises">Promises</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary" /> Current Role & Affiliation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CurrentPosition positions={politician.politician_positions ?? []} />
              <PartyAffiliation partyMemberships={politician.party_memberships ?? []} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5 text-primary" /> About</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                    {politician.bio || "No biography available."}
                </p>
                {politician.education && <p className="mt-2 text-sm"><strong>Education:</strong> {politician.education}</p>}
                {politician.political_journey && <p className="mt-2 text-sm"><strong>Political Journey:</strong> {politician.political_journey}</p>}
            </CardContent>
          </Card>

          {(politician.contact_email || politician.contact_phone || politician.twitter_handle || politician.facebook_profile_url) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Mail className="mr-2 h-5 w-5 text-primary" /> Contact & Social</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ContactInfo email={politician.contact_email} phone={politician.contact_phone} />
                <SocialMediaLinks twitterHandle={politician.twitter_handle} facebookProfileUrl={politician.facebook_profile_url} />
              </CardContent>
            </Card>
          )}
          
          {politician.public_criminal_records && (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-destructive"><AlertCircle className="mr-2 h-5 w-5" /> Public Criminal Records</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Note</AlertTitle>
                        <AlertDescription className="whitespace-pre-wrap">
                            {politician.public_criminal_records}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
          )}

        </TabsContent>

        <TabsContent value="career">
          <CareerTimeline careerEntries={politician.politician_career_entries ?? []} positions={politician.politician_positions ?? []} />
        </TabsContent>

        <TabsContent value="voting">
          <VotingHistory billVotes={politician.bill_votes ?? []} />
        </TabsContent>

        <TabsContent value="promises">
          <PromisesSection promises={politician.promises ?? []} />
        </TabsContent>
      </Tabs>
      <p className="text-xs text-muted-foreground text-center mt-8">
        Real-time updates are not yet implemented. Data is current as of last page load.
      </p>
    </div>
  );
}

    