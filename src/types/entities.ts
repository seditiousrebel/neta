
export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  role?: "User" | "Admin" | "Super Admin" | string | null; // Added Super Admin
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

export interface PromiseItem {
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
  summary: string | null;
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
  author?: string;
  timestamp: string; // ISO date string
  votes: number;
  userVote?: "up" | "down" | null;
  isFollowed: boolean;
}

export interface UserBadge {
  id: number;
  name: string;
  description: string;
  icon_asset_id?: number | null;
  awarded_at: string;
  icon_url?: string | null;
}

export interface UserContribution {
  id: number;
  entity_type: string;
  proposed_data: any;
  status: string;
  created_at: string;
  change_reason?: string | null;
  proposer_id?: string;
  users?: {
    email?: string | null;
    full_name?: string | null;
  } | null;
}

export type PoliticianPhoto = {
  storage_path: string | null;
};

export type PoliticianPartyForCard = {
  id: number;
  name: string;
  abbreviation: string | null;
  media_assets?: PoliticianPhoto | null; // For party logo
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

export type PoliticianSummary = {
  id: string;
  name: string;
  name_nepali?: string | null;
  photo_url?: string | null;
  current_party_name?: string | null;
  current_position_title?: string | null;
  public_criminal_records?: string | null;
  vote_score?: number;
};


export interface PartyFilterOption {
  id: string;
  name: string;
}

export interface ProvinceFilterOption {
  id: string;
  name: string;
}

export type PoliticianFiltersState = {
  partyId?: string | null;
  provinceId?: string | null;
  searchTerm?: string | null;
  hasCriminalRecord?: "any" | "yes" | "no" | string | null; // Allow string for safety
};

export type PoliticianMediaAsset = {
  id?: number;
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
  logo?: PoliticianMediaAsset | null; // Added for direct access to logo details
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
  parties: PoliticianParty | null; // Use the more detailed PoliticianParty type
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
  position_titles: PoliticianPositionTitle | null;
};

export type PoliticianBillVote = {
  id: number;
  vote: string;
  voted_at: string;
  legislative_bills: LegislativeBill | null;
};

export type PoliticianPromise = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  due_date?: string | null;
  evidence_links?: any | null; // JSONB can be any
};

// This interface represents a single entry in a politician's career or political journey.
// It's designed to be flexible for data stored as JSONB.
export interface CareerJourneyEntry {
  position?: string; // Or title, role, etc.
  organization?: string; // Or party, institution, etc.
  startDate?: string; // Or year, date_from, etc.
  endDate?: string | null; // Or year_to, date_to, etc.
  description?: string;
  // You can add other common fields you expect, e.g., type: 'Education' | 'Political Role'
  [key: string]: any; // Allows for other arbitrary fields if the JSON structure varies
}


export type DetailedPolitician = {
  id: number;
  name: string;
  name_nepali?: string | null;
  is_independent: boolean;
  dob?: string | null; // YYYY-MM-DD
  dob_bs?: string | null;
  gender?: 'Male' | 'Female' | 'Other' | 'PreferNotToSay' | string | null; // Allow string for flexibility from DB
  bio?: string | null;
  education?: string | any[] | null; // Can be JSON string or parsed array
  political_journey?: string | CareerJourneyEntry[] | null; // Can be JSON string or parsed array
  public_criminal_records?: string | any[] | null; // Can be JSON string or parsed array
  asset_declarations?: string | any[] | null; // Can be JSON string or parsed array
  twitter_handle?: string | null;
  facebook_profile_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  permanent_address?: string | null;
  current_address?: string | null;
  province_id?: number | null;
  created_at: string;
  updated_at: string;
  media_assets: PoliticianMediaAsset | null; // For politician's photo
  party_memberships: PoliticianPartyMembership[] | null;
  politician_positions: PoliticianPosition[] | null;
  bill_votes: PoliticianBillVote[] | null;
  promises: PoliticianPromise[] | null;
  politician_career_entries: CareerJourneyEntry[] | null;
};

export type AdminPendingEdit = {
  id: number;
  entity_type: string;
  entity_id: number | string | null;
  proposed_data: any;
  change_reason: string | null;
  created_at: string;
  proposer_id: string;
  status: string;
  admin_feedback: string | null;
  users: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
};
