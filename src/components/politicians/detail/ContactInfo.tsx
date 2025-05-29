
"use client";
import { Mail, Phone } from 'lucide-react';

interface ContactInfoProps {
  email?: string | null;
  phone?: string | null;
}

export default function ContactInfo({ email, phone }: ContactInfoProps) {
  if (!email && !phone) {
    return null; // <p className="text-sm text-muted-foreground">No contact information available.</p>;
  }

  return (
    <div className="space-y-2">
      {email && (
        <div className="flex items-center text-sm">
          <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
          <a href={`mailto:${email}`} className="text-primary hover:underline">
            {email}
          </a>
        </div>
      )}
      {phone && (
        <div className="flex items-center text-sm">
          <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
          <a href={`tel:${phone}`} className="text-primary hover:underline">
            {phone}
          </a>
        </div>
      )}
    </div>
  );
}
