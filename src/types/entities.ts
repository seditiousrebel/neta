
export interface User {
  id: string;
  name?: string | null; // Corresponds to full_name
  email?: string | null;
  avatarUrl?: string | null;
  role?: "User" | "Admin" | string | null; // Role from public.users
  contributionPoints?: number | null;
}

export type EntityType = "politician" | "party" | "promise" | "bill";

export interface Politician {
  id: string;
  name: string;
  partyId?: string;
  imageUrl?: string;
  bio?: string;
}

export interface Party {
  id: string;
  name: string;
  logoUrl?: string;
  platform?: string;
}

export interface Promise {
  id:string;
  title: string;
  description: string;
  status: "pending" | "fulfilled" | "broken" | "in_progress";
  politicianId?: string;
  partyId?: string;
}

export interface LegislativeBill {
  id: string;
  title: string;
  summary: string;
  status: "proposed" | "passed" | "rejected" | "in_committee";
  sponsorId?: string; // Politician ID
}

export interface FeedItemData {
  id: string;
  entityType: EntityType;
  title: string;
  summary: string;
  imageUrl?: string;
  author?: string; // Could be Politician name, Party name, etc.
  timestamp: string; // ISO date string
  votes: number;
  userVote?: "up" | "down" | null;
  isFollowed: boolean;
}
