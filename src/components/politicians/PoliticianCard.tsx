// src/components/politicians/PoliticianCard.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, ShieldAlert, Briefcase, Users, Share2, Heart } from 'lucide-react';

export interface PoliticianSummary {
  id: string; 
  name: string;
  name_nepali?: string | null;
  photo_url?: string | null; 
  current_party_name?: string | null;
  current_position_title?: string | null;
  has_criminal_record?: boolean | null; 
}

interface PoliticianCardProps {
  politician: PoliticianSummary;
}

const PoliticianCard: React.FC<PoliticianCardProps> = ({ politician }) => {
  const [isFollowed, setIsFollowed] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(politician.photo_url || '/placeholder-person.png');

  useEffect(() => {
    setCurrentPhotoUrl(politician.photo_url || '/placeholder-person.png');
  }, [politician.photo_url]);

  const handleFollow = async () => {
    setIsFollowed(!isFollowed);
    console.log(`Follow toggled for ${politician.name}, new state: ${!isFollowed}`);
    alert(`Follow action placeholder for ${politician.name}`);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/politicians/${politician.id}`;
    const shareTitle = politician.name;
    const shareText = `Check out ${politician.name} on [YourPlatformName]`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        console.log('Successfully shared');
      } catch (error) {
        console.error('Error sharing:', error);
        navigator.clipboard.writeText(shareUrl).then(() => {
          alert('Profile link copied to clipboard!');
        }).catch(err => console.error('Failed to copy link: ', err));
      }
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Profile link copied to clipboard!');
      }).catch(err => console.error('Failed to copy link: ', err));
    }
  };

  return (
    <Card className="w-full max-w-xs rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex flex-col bg-white dark:bg-gray-800">
      <Link href={`/politicians/${politician.id}`} passHref legacyBehavior>
        <a className="block group">
          <CardHeader className="p-0 relative h-48">
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              <Image
                src={currentPhotoUrl}
                alt={`Photo of ${politician.name}`}
                width={320} 
                height={192} 
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                onError={() => {
                  setCurrentPhotoUrl('/placeholder-person.png'); 
                }}
                priority={false} 
              />
            </div>
          </CardHeader>
        </a>
      </Link>
      
      <CardContent className="p-4 flex-grow">
        <Link href={`/politicians/${politician.id}`} passHref legacyBehavior>
          <a className="block group">
            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
              {politician.name}
            </CardTitle>
            {politician.name_nepali && (
              <p className="text-xs text-muted-foreground mb-2 group-hover:text-primary-focus transition-colors">{politician.name_nepali}</p>
            )}
          </a>
        </Link>

        {politician.current_position_title && (
          <div className="flex items-center text-xs text-muted-foreground mt-2">
            <Briefcase className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span>{politician.current_position_title}</span>
          </div>
        )}
        {politician.current_party_name && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Users className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span>{politician.current_party_name}</span>
          </div>
        )}
        {politician.has_criminal_record && (
          <div className="mt-2.5">
            <Badge variant="destructive" className="text-xs font-normal py-0.5 px-1.5">
              <ShieldAlert className="h-3 w-3 mr-1" />
              Criminal Record
            </Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-between items-center">
        <Button 
          variant={isFollowed ? "secondary" : "outline"} 
          size="sm" 
          onClick={handleFollow}
          className="text-xs h-8"
        >
          <Heart className={`h-3.5 w-3.5 mr-1.5 ${isFollowed ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          {isFollowed ? 'Following' : 'Follow'}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleShare} title="Share Profile" className="h-8 w-8">
          <Share2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PoliticianCard;
