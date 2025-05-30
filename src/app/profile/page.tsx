
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { User, UserBadge, UserContribution } from '@/types/entities';
import type { Database, Tables } from '@/types/supabase';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, Edit3, FileText, LogOut, ShieldCheck, UserCircle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Helper function to get user initials
const getInitials = (name?: string | null) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
};

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  console.log('[ProfilePage Server Component] authUser state:', authUser ? `User ID: ${authUser.id}` : 'No authUser found');

  if (!authUser) {
    console.log('[ProfilePage Server Component] Redirecting to login because authUser is null.');
    redirect('/auth/login?next=/profile');
  }

  // Fetch detailed user profile from public.users
  const { data: userProfileData, error: profileError } = await supabase
    .from('users')
    .select('id, full_name, email, role, contribution_points, bio') // Removed avatar_url as it's not in public.users
    .eq('id', authUser.id)
    .maybeSingle<Pick<Tables<'users'>['Row'], 'id' | 'full_name' | 'email' | 'role' | 'contribution_points' | 'bio'>>();

  let currentUser: User;

  if (profileError) {
    console.error('[ProfilePage Server Component] Error fetching user profile from public.users:', profileError.message);
  }

  if (userProfileData) {
    currentUser = {
      id: userProfileData.id,
      name: userProfileData.full_name,
      email: userProfileData.email,
      avatarUrl: authUser.user_metadata?.avatar_url || `https://placehold.co/100x100.png?text=${getInitials(userProfileData.full_name)}`,
      bio: userProfileData.bio || (authUser.user_metadata?.bio as string) || null,
      role: userProfileData.role || 'User',
      contributionPoints: userProfileData.contribution_points,
    };
  } else {
    console.warn(`[ProfilePage Server Component] No public.users record found for user ID: ${authUser.id}. Using fallback data from auth.user_metadata.`);
    currentUser = {
      id: authUser.id,
      name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
      email: authUser.email,
      avatarUrl: authUser.user_metadata?.avatar_url || `https://placehold.co/100x100.png?text=${getInitials(authUser.user_metadata?.full_name || authUser.email)}`,
      bio: (authUser.user_metadata?.bio as string) || null,
      role: (authUser.user_metadata?.role as string) || 'User', // Fallback to metadata role or default
      contributionPoints: 0, // Default points
    };
  }

  const { data: badgesData, error: badgesError } = await supabase
    .from('user_badges')
    .select(`
      awarded_at,
      badges (
        id,
        name,
        description,
        icon_asset_id
      )
    `)
    .eq('user_id', authUser.id);

  if (badgesError) {
    console.error("[ProfilePage Server Component] Error fetching user badges:", badgesError.message);
  }
  const userBadges: UserBadge[] = badgesData?.map(ub => ({
    // @ts-ignore TODO: Fix type for badges relation if it's nullable
    id: ub.badges!.id,
    // @ts-ignore
    name: ub.badges!.name,
    // @ts-ignore
    description: ub.badges!.description,
    // @ts-ignore
    icon_asset_id: ub.badges!.icon_asset_id,
    awarded_at: ub.awarded_at,
  })) || [];


  const { data: contributionsData, error: contributionsError } = await supabase
    .from('pending_edits')
    .select('id, entity_type, proposed_data, status, created_at, change_reason')
    .eq('proposer_id', authUser.id)
    .order('created_at', { ascending: false })
    .limit(10);

   if (contributionsError) {
    console.error("[ProfilePage Server Component] Error fetching user contributions:", contributionsError.message);
  }
  const userContributions: UserContribution[] = contributionsData?.map(c => ({
    ...c,
    proposed_data: typeof c.proposed_data === 'string' ? JSON.parse(c.proposed_data) : c.proposed_data,
  })) || [];


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
           <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary">
            <AvatarImage src={currentUser.avatarUrl || undefined} alt={currentUser.name || 'User'} data-ai-hint="profile page avatar" />
            <AvatarFallback className="text-2xl sm:text-3xl">{getInitials(currentUser.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{currentUser.name}</h1>
            <p className="text-muted-foreground">{currentUser.email}</p>
             {currentUser.role && (
                <div className="mt-1 flex items-center text-sm text-muted-foreground">
                  <ShieldCheck className="mr-1.5 h-4 w-4 text-primary" />
                  Role: {currentUser.role}
                </div>
              )}
          </div>
        </div>
      </div>

      {currentUser.bio && (
        <Card>
          <CardHeader><CardTitle>About Me</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{currentUser.bio}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Edit3 className="mr-2 h-5 w-5 text-primary" /> Edit Profile</CardTitle>
          <CardDescription>Update your personal information and avatar.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm currentUser={currentUser} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>Your activity and achievements on Netrika.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
            <div>
                <p className="text-3xl font-bold text-primary">{currentUser.contributionPoints ?? 0}</p>
                <p className="text-sm text-muted-foreground">Contribution Points</p>
            </div>
            <div>
                <p className="text-3xl font-bold">{userBadges.length}</p>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Award className="mr-2 h-5 w-5 text-primary" /> My Badges</CardTitle>
          <CardDescription>Badges you've earned for your contributions.</CardDescription>
        </CardHeader>
        <CardContent>
          {userBadges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {userBadges.map((badge) => (
                <div key={badge.id} className="flex flex-col items-center text-center p-3 border rounded-lg hover:shadow-md transition-shadow">
                  <Award className="h-12 w-12 text-yellow-500 mb-2" data-ai-hint="award trophy" />
                  <p className="font-semibold text-sm">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Awarded: {new Date(badge.awarded_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No badges earned yet. Keep contributing!</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" /> My Contributions</CardTitle>
          <CardDescription>A log of your recent proposed edits and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          {userContributions.length > 0 ? (
            <ul className="space-y-4">
              {userContributions.map((contrib) => (
                <li key={contrib.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <p className="font-medium">
                      Edit to {contrib.entity_type}
                    </p>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      contrib.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      contrib.status === 'Denied' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {contrib.status}
                    </span>
                  </div>
                  {contrib.change_reason && <p className="text-sm text-muted-foreground mt-1">Reason: {contrib.change_reason}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted: {new Date(contrib.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">You haven't made any contributions yet, or they are still under review.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
