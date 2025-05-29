
export interface User {
  id: string;
  name?: string | null; // Corresponds to full_name from public.users or auth metadata
  email?: string | null;
  avatarUrl?: string | null; // URL from public.users.avatar_url or auth metadata
  bio?: string | null; // From public.users.bio or auth metadata
  role?: "User" | "Admin" | string | null; // Role from public.users
  contributionPoints?: number | null; // From public.users
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

export interface PromiseItem { // Renamed from Promise to avoid conflict with JS Promise
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

// Types related to profile page data
export interface UserBadge {
  id: number; // badge id
  name: string;
  description: string;
  icon_asset_id?: number | null; // from badges table
  awarded_at: string; // from user_badges table
  icon_url?: string | null; // if you join with media_assets for icon
}

export interface UserContribution {
  id: number; // pending_edit id
  entity_type: string; // Database["public"]["Enums"]["entity_type"]
  proposed_data: any; // JSON
  status: string; // Database["public"]["Enums"]["edit_status"]
  created_at: string;
  change_reason?: string | null;
}


// Politician Directory Types
export type PoliticianPhoto = {
  storage_path: string | null;
};

export type PoliticianPartyForCard = {
  id: number;
  name: string;
  abbreviation: string | null;
  media_assets?: PoliticianPhoto | null;
};

export type PoliticianPartyMembershipForCard = {
  is_active: boolean;
  parties: PoliticianPartyForCard | null;
};

export type PoliticianPositionTitleForCard = {
  id: number;
  title: string;
};

export type PoliticianPositionForCard = {
  is_current: boolean;
  position_titles: PoliticianPositionTitleForCard | null;
};

// This is the main type for items in the politician directory list
export type PoliticianCardData = {
  id: number;
  name: string;
  bio: string | null;
  fts_vector?: any;
  media_assets: PoliticianPhoto | null; // For politician's main photo (direct relation from politicians.photo_asset_id)
  party_memberships: PoliticianPartyMembershipForCard[];
  politician_positions: PoliticianPositionForCard[];
  is_followed_by_user?: boolean;
  vote_score: number; // Total sum of votes (upvotes - downvotes)
  // user_vote_status will be managed client-side in the PoliticianCard component
};

// For filter dropdowns
export interface PartyFilterOption {
  id: number;
  name: string;
}

export interface ProvinceFilterOption {
  id: number;
  name: string;
}

export type PoliticianFiltersState = {
  partyId?: string | null;
  provinceId?: string | null;
  searchTerm?: string | null;
};

