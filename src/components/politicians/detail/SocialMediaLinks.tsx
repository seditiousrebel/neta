
"use client";
import { Twitter, Facebook } from 'lucide-react';

interface SocialMediaLinksProps {
  twitterHandle?: string | null;
  facebookProfileUrl?: string | null;
}

export default function SocialMediaLinks({ twitterHandle, facebookProfileUrl }: SocialMediaLinksProps) {
  if (!twitterHandle && !facebookProfileUrl) {
    return null; // <p className="text-sm text-muted-foreground">No social media links available.</p>;
  }

  return (
    <div className="flex items-center gap-4">
      {twitterHandle && (
        <a
          href={`https://twitter.com/${twitterHandle.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-sm text-primary hover:underline"
          aria-label={`Twitter profile of ${twitterHandle}`}
        >
          <Twitter className="w-5 h-5 mr-1" /> Twitter
        </a>
      )}
      {facebookProfileUrl && (
        <a
          href={facebookProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-sm text-primary hover:underline"
          aria-label="Facebook profile"
        >
          <Facebook className="w-5 h-5 mr-1" /> Facebook
        </a>
      )}
    </div>
  );
}
