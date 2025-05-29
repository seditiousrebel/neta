
"use client";

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogOut, UserCircle, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
        <Card className="max-w-md mx-auto">
          <CardHeader className="items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    return (
      <div className="space-y-6 text-center py-12">
        <UserCircle className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="text-muted-foreground">You are not logged in.</p>
        <p className="text-sm">Please log in to view your profile and manage your account.</p>
        {/* Login button is in the header, but could be duplicated here */}
        {/* <Button onClick={() => {/* trigger login modal from header or context * /}}>Login</Button> */}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
      <Card className="max-w-md mx-auto shadow-lg rounded-xl">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarImage src={user.avatarUrl || ''} alt={user.name || 'User'} data-ai-hint="profile picture" />
            <AvatarFallback className="text-3xl">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            <Edit className="mr-2 h-4 w-4" /> Edit Profile (Coming Soon)
          </Button>
          <Button onClick={logout} variant="destructive" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-md mx-auto mt-6">
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>Your activity on Netrika.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-center">
            <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Items Followed</p>
            </div>
            <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Votes Cast</p>
            </div>
            <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Edits Submitted</p>
            </div>
             <div>
                <p className="text-2xl font-bold">7</p>
                <p className="text-sm text-muted-foreground">Comments Made</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
