
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
  bill_number?: string | null;
  introduced_date?: string | null;
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
  media_assets?: PoliticianPhoto | null; // This specifically targets the logo via alias
  logo?: PoliticianPhoto | null; // Added for consistency if logo is directly selected
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
  public_criminal_records: string | null;
  fts_vector?: any;
  media_assets: PoliticianPhoto | null; // For politician's main photo
  party_memberships: PoliticianPartyMembershipForCard[];
  politician_positions: PoliticianPositionForCard[];
  is_followed_by_user?: boolean;
  vote_score: number;
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
  hasCriminalRecord?: "any" | "yes" | "no" | null;
};


// Types for Detailed Politician Page
export type PoliticianMediaAsset = {
  id: number;
  storage_path: string | null;
  alt_text?: string | null;
  caption?: string | null;
};

export type PoliticianParty = {
  id: number;
  name: string;
  name_nepali?: string | null;
  abbreviation?: string | null;
  logo_asset_id?: number | null;
  // Assuming logo is fetched as nested media_asset
  logo?: PoliticianMediaAsset | null;
  ideology?: string | null;
};

export type PoliticianPartyMembership = {
  id: number;
  politician_id: number;
  party_id: number;
  start_date?: string | null;
  end_date?: string | null;
  role_in_party?: string | null;
  is_active?: boolean | null;
  parties: PoliticianParty; // Nested party data
};

export type PoliticianPositionTitle = {
  id: number;
  title: string;
  title_nepali?: string | null;
};

export type PoliticianPosition = {
  id: number;
  politician_id: number;
  position_title_id: number;
  start_date: string;
  end_date?: string | null;
  is_current?: boolean | null;
  description?: string | null;
  position_titles: PoliticianPositionTitle; // Nested position title data
};

export type PoliticianBillVote = {
  id: number;
  vote: string; // Assuming 'Yea', 'Nay', 'Abstain' from an ENUM
  voted_at: string;
  legislative_bills: LegislativeBill; // Nested bill data
};

export type PoliticianPromise = {
  id: number;
  title: string;
  description?: string | null;
  status: string; // Assuming 'Pending', 'Fulfilled', 'Broken' from an ENUM
  due_date?: string | null;
  evidence_links?: any | null; // JSON
};

export type PoliticianCareerEntry = {
  id: number;
  entry_type: string; // e.g., 'Position Held', 'Education' - from an ENUM
  title: string;
  organization_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
};

export type DetailedPolitician = {
  id: number;
  name: string;
  name_nepali?: string | null;
  is_independent: boolean;
  dob?: string | null;
  gender?: string | null; // From gender_enum
  bio?: string | null;
  education?: string | null;
  political_journey?: string | null;
  public_criminal_records?: string | null;
  asset_declarations?: string | null;
  twitter_handle?: string | null;
  facebook_profile_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  permanent_address?: string | null;
  current_address?: string | null;
  province_id?: number | null;
  created_at: string;
  updated_at: string;
  media_assets: PoliticianMediaAsset | null; // Main photo
  party_memberships: PoliticianPartyMembership[];
  politician_positions: PoliticianPosition[];
  bill_votes: PoliticianBillVote[];
  promises: PoliticianPromise[];
  politician_career_entries: PoliticianCareerEntry[];
  // politician_ratings: any | null; // If you add ratings back
  vote_score?: number; // Calculated or from politician_votes summary
};
