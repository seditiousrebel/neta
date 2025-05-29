
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { DetailedPolitician } from '@/types/entities';
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
  const { data, error } = await supabase
    .from('politicians')
    .select(`
      *,
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
      bill_votes (
        *,
        legislative_bills ( * )
      ),
      promises ( * ),
      politician_career_entries ( * )
    `)
    .eq('id', id)
    .single<DetailedPolitician>(); // Cast to DetailedPolitician

  if (error) {
    console.error('Error fetching politician details:', error.message, error.details);
    // Optionally, you could return null or throw a more specific error
    // For now, let's return null and let the page handle "not found"
    return null;
  }
  return data;
}

export default async function PoliticianDetailPage({ params }: { params: { id: string } }) {
  const politicianId = params.id;
  if (isNaN(parseInt(politicianId))) {
    notFound();
  }

  const politician = await getPoliticianDetails(politicianId);

  if (!politician) {
    notFound(); // Or return a custom "Politician not found" component
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
              <CurrentPosition positions={politician.politician_positions} />
              <PartyAffiliation partyMemberships={politician.party_memberships} />
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
          <CareerTimeline careerEntries={politician.politician_career_entries} positions={politician.politician_positions} />
        </TabsContent>

        <TabsContent value="voting">
          <VotingHistory billVotes={politician.bill_votes} />
        </TabsContent>

        <TabsContent value="promises">
          <PromisesSection promises={politician.promises} />
        </TabsContent>
      </Tabs>
      <p className="text-xs text-muted-foreground text-center mt-8">
        Real-time updates are not yet implemented. Data is current as of last page load.
      </p>
    </div>
  );
}
