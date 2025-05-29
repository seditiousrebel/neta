export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string | null
          description: string
          icon_asset_id: number | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          icon_asset_id?: number | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          icon_asset_id?: number | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bill_votes: {
        Row: {
          bill_id: number
          comments: string | null
          created_at: string | null
          id: number
          politician_id: number
          updated_at: string | null
          vote: Database["public"]["Enums"]["vote_option"]
          voted_at: string
        }
        Insert: {
          bill_id: number
          comments?: string | null
          created_at?: string | null
          id?: number
          politician_id: number
          updated_at?: string | null
          vote: Database["public"]["Enums"]["vote_option"]
          voted_at?: string
        }
        Update: {
          bill_id?: number
          comments?: string | null
          created_at?: string | null
          id?: number
          politician_id?: number
          updated_at?: string | null
          vote?: Database["public"]["Enums"]["vote_option"]
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_votes_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "legislative_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_votes_politician_id_fkey"
            columns: ["politician_id"]
            isOneToOne: false
            referencedRelation: "politicians"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_memberships: {
        Row: {
          committee_id: number
          created_at: string | null
          end_date: string | null
          id: number
          politician_id: number
          role: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          committee_id: number
          created_at?: string | null
          end_date?: string | null
          id?: number
          politician_id: number
          role?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          committee_id?: number
          created_at?: string | null
          end_date?: string | null
          id?: number
          politician_id?: number
          role?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_memberships_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      committees: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          legislative_body_id: number | null
          name: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          legislative_body_id?: number | null
          name: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          legislative_body_id?: number | null
          name?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committees_legislative_body_id_fkey"
            columns: ["legislative_body_id"]
            isOneToOne: false
            referencedRelation: "legislative_bodies"
            referencedColumns: ["id"]
          },
        ]
      }
      constituencies: {
        Row: {
          constituency_number: number | null
          created_at: string | null
          district_id: number
          id: number
          name: string
          type: Database["public"]["Enums"]["constituency_type"]
          updated_at: string | null
        }
        Insert: {
          constituency_number?: number | null
          created_at?: string | null
          district_id: number
          id?: number
          name: string
          type: Database["public"]["Enums"]["constituency_type"]
          updated_at?: string | null
        }
        Update: {
          constituency_number?: number | null
          created_at?: string | null
          district_id?: number
          id?: number
          name?: string
          type?: Database["public"]["Enums"]["constituency_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "constituencies_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      controversies: {
        Row: {
          controversy_date: string | null
          controversy_date_bs: string | null
          created_at: string | null
          description: string | null
          fts_vector: unknown | null
          id: number
          severity: Database["public"]["Enums"]["controversy_severity"] | null
          source_links: Json | null
          status: Database["public"]["Enums"]["controversy_status_enum"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          controversy_date?: string | null
          controversy_date_bs?: string | null
          created_at?: string | null
          description?: string | null
          fts_vector?: unknown | null
          id?: number
          severity?: Database["public"]["Enums"]["controversy_severity"] | null
          source_links?: Json | null
          status?: Database["public"]["Enums"]["controversy_status_enum"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          controversy_date?: string | null
          controversy_date_bs?: string | null
          created_at?: string | null
          description?: string | null
          fts_vector?: unknown | null
          id?: number
          severity?: Database["public"]["Enums"]["controversy_severity"] | null
          source_links?: Json | null
          status?: Database["public"]["Enums"]["controversy_status_enum"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      districts: {
        Row: {
          created_at: string | null
          id: number
          name: string
          province_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          province_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          province_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      elections: {
        Row: {
          created_at: string | null
          description: string | null
          election_date: string
          election_date_bs: string | null
          id: number
          name: string
          type: Database["public"]["Enums"]["election_type_enum"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          election_date: string
          election_date_bs?: string | null
          id?: number
          name: string
          type?: Database["public"]["Enums"]["election_type_enum"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          election_date?: string
          election_date_bs?: string | null
          id?: number
          name?: string
          type?: Database["public"]["Enums"]["election_type_enum"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      entity_controversies: {
        Row: {
          controversy_id: number
          created_at: string | null
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
        }
        Insert: {
          controversy_id: number
          created_at?: string | null
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
        }
        Update: {
          controversy_id?: number
          created_at?: string | null
          entity_id?: number
          entity_type?: Database["public"]["Enums"]["entity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "entity_controversies_controversy_id_fkey"
            columns: ["controversy_id"]
            isOneToOne: false
            referencedRelation: "controversies"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_revisions: {
        Row: {
          approved_at: string
          approver_id: string | null
          created_at: string | null
          data: Json
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: number
          submitter_id: string | null
        }
        Insert: {
          approved_at?: string
          approver_id?: string | null
          created_at?: string | null
          data: Json
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: number
          submitter_id?: string | null
        }
        Update: {
          approved_at?: string
          approver_id?: string | null
          created_at?: string | null
          data?: Json
          entity_id?: number
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: number
          submitter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_revisions_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_revisions_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_tags: {
        Row: {
          created_at: string | null
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          tag_id: number
        }
        Insert: {
          created_at?: string | null
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          tag_id: number
        }
        Update: {
          created_at?: string | null
          entity_id?: number
          entity_type?: Database["public"]["Enums"]["entity_type"]
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_votes: {
        Row: {
          created_at: string | null
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          user_id: string
          vote_type: number
        }
        Insert: {
          created_at?: string | null
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          user_id: string
          vote_type: number
        }
        Update: {
          created_at?: string | null
          entity_id?: number
          entity_type?: Database["public"]["Enums"]["entity_type"]
          user_id?: string
          vote_type?: number
        }
        Relationships: [
          {
            foreignKeyName: "entity_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_content: {
        Row: {
          created_at: string | null
          display_order: number | null
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: number
          is_active: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: number
          is_active?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          entity_id?: number
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: number
          is_active?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: number
          entity_type?: Database["public"]["Enums"]["entity_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      legislative_bills: {
        Row: {
          bill_number: string | null
          created_at: string | null
          fts_vector: unknown | null
          id: number
          introduced_date: string | null
          introduced_in_body_id: number | null
          parliamentary_stage:
            | Database["public"]["Enums"]["bill_parliamentary_stage_enum"]
            | null
          sponsorship_details: Json | null
          status: Database["public"]["Enums"]["bill_status"]
          summary: string | null
          text_asset_id: number | null
          title: string
          title_nepali: string | null
          updated_at: string | null
        }
        Insert: {
          bill_number?: string | null
          created_at?: string | null
          fts_vector?: unknown | null
          id?: number
          introduced_date?: string | null
          introduced_in_body_id?: number | null
          parliamentary_stage?:
            | Database["public"]["Enums"]["bill_parliamentary_stage_enum"]
            | null
          sponsorship_details?: Json | null
          status?: Database["public"]["Enums"]["bill_status"]
          summary?: string | null
          text_asset_id?: number | null
          title: string
          title_nepali?: string | null
          updated_at?: string | null
        }
        Update: {
          bill_number?: string | null
          created_at?: string | null
          fts_vector?: unknown | null
          id?: number
          introduced_date?: string | null
          introduced_in_body_id?: number | null
          parliamentary_stage?:
            | Database["public"]["Enums"]["bill_parliamentary_stage_enum"]
            | null
          sponsorship_details?: Json | null
          status?: Database["public"]["Enums"]["bill_status"]
          summary?: string | null
          text_asset_id?: number | null
          title?: string
          title_nepali?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legislative_bills_introduced_in_body_id_fkey"
            columns: ["introduced_in_body_id"]
            isOneToOne: false
            referencedRelation: "legislative_bodies"
            referencedColumns: ["id"]
          },
        ]
      }
      legislative_bodies: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: Database["public"]["Enums"]["legislative_body_name"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: Database["public"]["Enums"]["legislative_body_name"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: Database["public"]["Enums"]["legislative_body_name"]
          updated_at?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          file_name: string | null
          file_size_bytes: number | null
          id: number
          mime_type: string | null
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          file_name?: string | null
          file_size_bytes?: number | null
          id?: number
          mime_type?: string | null
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          file_name?: string | null
          file_size_bytes?: number | null
          id?: number
          mime_type?: string | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      municipalities: {
        Row: {
          created_at: string | null
          district_id: number
          id: number
          name: string
          type: Database["public"]["Enums"]["municipality_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          district_id: number
          id?: number
          name: string
          type: Database["public"]["Enums"]["municipality_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          district_id?: number
          id?: number
          name?: string
          type?: Database["public"]["Enums"]["municipality_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "municipalities_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      news_article_tags: {
        Row: {
          article_id: number
          created_at: string | null
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
        }
        Insert: {
          article_id: number
          created_at?: string | null
          entity_id: number
          entity_type: Database["public"]["Enums"]["entity_type"]
        }
        Update: {
          article_id?: number
          created_at?: string | null
          entity_id?: number
          entity_type?: Database["public"]["Enums"]["entity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "news_article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          author_id: string | null
          created_at: string | null
          fts_vector: unknown | null
          full_content: string | null
          id: number
          is_original_content: boolean
          link_url: string | null
          published_date: string | null
          source_name: string | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          created_at?: string | null
          fts_vector?: unknown | null
          full_content?: string | null
          id?: number
          is_original_content?: boolean
          link_url?: string | null
          published_date?: string | null
          source_name?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          created_at?: string | null
          fts_vector?: unknown | null
          full_content?: string | null
          id?: number
          is_original_content?: boolean
          link_url?: string | null
          published_date?: string | null
          source_name?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean
          link_url: string | null
          message: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean
          link_url?: string | null
          message: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean
          link_url?: string | null
          message?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          abbreviation: string | null
          chairperson_id: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          election_symbol_asset_id: number | null
          facebook_profile_url: string | null
          founded_date: string | null
          founded_date_bs: string | null
          fts_vector: unknown | null
          general_secretary_id: number | null
          headquarters_address: string | null
          history: string | null
          id: number
          ideology: string | null
          logo_asset_id: number | null
          name: string
          name_nepali: string | null
          registration_number: string | null
          twitter_handle: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          abbreviation?: string | null
          chairperson_id?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          election_symbol_asset_id?: number | null
          facebook_profile_url?: string | null
          founded_date?: string | null
          founded_date_bs?: string | null
          fts_vector?: unknown | null
          general_secretary_id?: number | null
          headquarters_address?: string | null
          history?: string | null
          id?: never
          ideology?: string | null
          logo_asset_id?: number | null
          name: string
          name_nepali?: string | null
          registration_number?: string | null
          twitter_handle?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          abbreviation?: string | null
          chairperson_id?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          election_symbol_asset_id?: number | null
          facebook_profile_url?: string | null
          founded_date?: string | null
          founded_date_bs?: string | null
          fts_vector?: unknown | null
          general_secretary_id?: number | null
          headquarters_address?: string | null
          history?: string | null
          id?: never
          ideology?: string | null
          logo_asset_id?: number | null
          name?: string
          name_nepali?: string | null
          registration_number?: string | null
          twitter_handle?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parties_chairperson_id_fkey"
            columns: ["chairperson_id"]
            isOneToOne: false
            referencedRelation: "politicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parties_election_symbol_asset_id_fkey"
            columns: ["election_symbol_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parties_general_secretary_id_fkey"
            columns: ["general_secretary_id"]
            isOneToOne: false
            referencedRelation: "politicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parties_logo_asset_id_fkey"
            columns: ["logo_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      party_alliances: {
        Row: {
          alliance_type: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: number
          name: string | null
          party_a_id: number
          party_b_id: number
          start_date: string
          updated_at: string | null
        }
        Insert: {
          alliance_type?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          name?: string | null
          party_a_id: number
          party_b_id: number
          start_date: string
          updated_at?: string | null
        }
        Update: {
          alliance_type?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          name?: string | null
          party_a_id?: number
          party_b_id?: number
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      party_election_results: {
        Row: {
          constituency_id: number | null
          created_at: string | null
          election_id: number
          id: number
          notes: string | null
          party_id: number
          seats_won: number | null
          updated_at: string | null
          vote_percentage: number | null
          votes_gained: number | null
        }
        Insert: {
          constituency_id?: number | null
          created_at?: string | null
          election_id: number
          id?: number
          notes?: string | null
          party_id: number
          seats_won?: number | null
          updated_at?: string | null
          vote_percentage?: number | null
          votes_gained?: number | null
        }
        Update: {
          constituency_id?: number | null
          created_at?: string | null
          election_id?: number
          id?: number
          notes?: string | null
          party_id?: number
          seats_won?: number | null
          updated_at?: string | null
          vote_percentage?: number | null
          votes_gained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "party_election_results_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_election_results_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      party_memberships: {
        Row: {
          created_at: string
          end_date: string | null
          id: number
          is_active: boolean | null
          party_id: number
          politician_id: number
          role_in_party: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: never
          is_active?: boolean | null
          party_id: number
          politician_id: number
          role_in_party?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: never
          is_active?: boolean | null
          party_id?: number
          politician_id?: number
          role_in_party?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "party_memberships_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_memberships_politician_id_fkey"
            columns: ["politician_id"]
            isOneToOne: false
            referencedRelation: "politicians"
            referencedColumns: ["id"]
          },
        ]
      }
      party_splits: {
        Row: {
          created_at: string | null
          id: number
          new_party_id: number
          original_party_id: number
          reason: string | null
          split_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          new_party_id: number
          original_party_id: number
          reason?: string | null
          split_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          new_party_id?: number
          original_party_id?: number
          reason?: string | null
          split_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pending_edits: {
        Row: {
          admin_feedback: string | null
          change_reason: string | null
          created_at: string | null
          entity_id: number | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: number
          moderator_id: string | null
          proposed_data: Json
          proposer_id: string
          status: Database["public"]["Enums"]["edit_status"]
          updated_at: string | null
        }
        Insert: {
          admin_feedback?: string | null
          change_reason?: string | null
          created_at?: string | null
          entity_id?: number | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: number
          moderator_id?: string | null
          proposed_data: Json
          proposer_id: string
          status?: Database["public"]["Enums"]["edit_status"]
          updated_at?: string | null
        }
        Update: {
          admin_feedback?: string | null
          change_reason?: string | null
          created_at?: string | null
          entity_id?: number | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: number
          moderator_id?: string | null
          proposed_data?: Json
          proposer_id?: string
          status?: Database["public"]["Enums"]["edit_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_edits_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_edits_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      politician_career_entries: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          entry_type: Database["public"]["Enums"]["career_entry_type"]
          id: number
          organization_name: string | null
          politician_id: number
          start_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          entry_type: Database["public"]["Enums"]["career_entry_type"]
          id?: number
          organization_name?: string | null
          politician_id: number
          start_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          entry_type?: Database["public"]["Enums"]["career_entry_type"]
          id?: number
          organization_name?: string | null
          politician_id?: number
          start_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      politician_positions: {
        Row: {
          constituency_id: number | null
          created_at: string
          description: string | null
          election_id: number | null
          election_method: Database["public"]["Enums"]["election_method"] | null
          end_date: string | null
          id: number
          is_current: boolean | null
          legislative_body_id: number | null
          municipality_id: number | null
          party_at_time_id: number | null
          politician_id: number
          position_title_id: number
          start_date: string
          updated_at: string
        }
        Insert: {
          constituency_id?: number | null
          created_at?: string
          description?: string | null
          election_id?: number | null
          election_method?:
            | Database["public"]["Enums"]["election_method"]
            | null
          end_date?: string | null
          id?: never
          is_current?: boolean | null
          legislative_body_id?: number | null
          municipality_id?: number | null
          party_at_time_id?: number | null
          politician_id: number
          position_title_id: number
          start_date: string
          updated_at?: string
        }
        Update: {
          constituency_id?: number | null
          created_at?: string
          description?: string | null
          election_id?: number | null
          election_method?:
            | Database["public"]["Enums"]["election_method"]
            | null
          end_date?: string | null
          id?: never
          is_current?: boolean | null
          legislative_body_id?: number | null
          municipality_id?: number | null
          party_at_time_id?: number | null
          politician_id?: number
          position_title_id?: number
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "politician_positions_party_at_time_id_fkey"
            columns: ["party_at_time_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politician_positions_politician_id_fkey"
            columns: ["politician_id"]
            isOneToOne: false
            referencedRelation: "politicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politician_positions_position_title_id_fkey"
            columns: ["position_title_id"]
            isOneToOne: false
            referencedRelation: "position_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      politician_ratings: {
        Row: {
          created_at: string | null
          last_calculated: string
          overall_rating: number | null
          politician_id: number
          promise_fulfillment_rate: number | null
          updated_at: string | null
          vote_score: number
        }
        Insert: {
          created_at?: string | null
          last_calculated: string
          overall_rating?: number | null
          politician_id: number
          promise_fulfillment_rate?: number | null
          updated_at?: string | null
          vote_score?: number
        }
        Update: {
          created_at?: string | null
          last_calculated?: string
          overall_rating?: number | null
          politician_id?: number
          promise_fulfillment_rate?: number | null
          updated_at?: string | null
          vote_score?: number
        }
        Relationships: []
      }
      politician_votes: {
        Row: {
          created_at: string
          id: number
          politician_id: number
          updated_at: string
          user_id: string
          vote_type: number
        }
        Insert: {
          created_at?: string
          id?: number
          politician_id: number
          updated_at?: string
          user_id: string
          vote_type: number
        }
        Update: {
          created_at?: string
          id?: number
          politician_id?: number
          updated_at?: string
          user_id?: string
          vote_type?: number
        }
        Relationships: [
          {
            foreignKeyName: "politician_votes_politician_id_fkey"
            columns: ["politician_id"]
            isOneToOne: false
            referencedRelation: "politicians"
            referencedColumns: ["id"]
          },
        ]
      }
      politicians: {
        Row: {
          asset_declarations: string | null
          bio: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          current_address: string | null
          dob: string | null
          dob_bs: string | null
          education: string | null
          facebook_profile_url: string | null
          fts_vector: unknown | null
          gender: string | null
          id: number
          is_independent: boolean
          name: string
          name_nepali: string | null
          permanent_address: string | null
          photo_asset_id: number | null
          political_journey: string | null
          province_id: number | null
          public_criminal_records: string | null
          twitter_handle: string | null
          updated_at: string
        }
        Insert: {
          asset_declarations?: string | null
          bio?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          current_address?: string | null
          dob?: string | null
          dob_bs?: string | null
          education?: string | null
          facebook_profile_url?: string | null
          fts_vector?: unknown | null
          gender?: string | null
          id?: never
          is_independent?: boolean
          name: string
          name_nepali?: string | null
          permanent_address?: string | null
          photo_asset_id?: number | null
          political_journey?: string | null
          province_id?: number | null
          public_criminal_records?: string | null
          twitter_handle?: string | null
          updated_at?: string
        }
        Update: {
          asset_declarations?: string | null
          bio?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          current_address?: string | null
          dob?: string | null
          dob_bs?: string | null
          education?: string | null
          facebook_profile_url?: string | null
          fts_vector?: unknown | null
          gender?: string | null
          id?: never
          is_independent?: boolean
          name?: string
          name_nepali?: string | null
          permanent_address?: string | null
          photo_asset_id?: number | null
          political_journey?: string | null
          province_id?: number | null
          public_criminal_records?: string | null
          twitter_handle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "politicians_photo_asset_id_fkey"
            columns: ["photo_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politicians_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      position_titles: {
        Row: {
          created_at: string
          id: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promises: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          election_id: number | null
          evidence_links: Json | null
          id: number
          party_id: number | null
          politician_id: number | null
          status: Database["public"]["Enums"]["promise_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          election_id?: number | null
          evidence_links?: Json | null
          id?: number
          party_id?: number | null
          politician_id?: number | null
          status?: Database["public"]["Enums"]["promise_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          election_id?: number | null
          evidence_links?: Json | null
          id?: number
          party_id?: number | null
          politician_id?: number | null
          status?: Database["public"]["Enums"]["promise_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promises_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promises_politician_id_fkey"
            columns: ["politician_id"]
            isOneToOne: false
            referencedRelation: "politicians"
            referencedColumns: ["id"]
          },
        ]
      }
      provinces: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          id: number
          is_featured: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_featured?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_featured?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_id: number
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: number
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_asset_id: number | null
          avatar_url: string | null
          bio: string | null
          contribution_points: number
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_asset_id?: number | null
          avatar_url?: string | null
          bio?: string | null
          contribution_points?: number
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_asset_id?: number | null
          avatar_url?: string | null
          bio?: string | null
          contribution_points?: number
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      bill_parliamentary_stage_enum:
        | "Tabled"
        | "General Discussion"
        | "Clause-wise Discussion"
        | "Committee Deliberation"
        | "Voting"
        | "Passed by House"
        | "Sent to Other House"
        | "Joint Committee"
        | "Presidential Authentication"
        | "Gazetted"
      bill_status:
        | "Introduced"
        | "In Committee"
        | "Voting"
        | "Passed"
        | "Failed"
        | "Authenticated"
        | "Withdrawn"
      career_entry_type:
        | "Position Held"
        | "Education"
        | "Political Milestone"
        | "Controversy Involvement"
        | "Award/Recognition"
        | "Other"
      constituency_type:
        | "Federal House of Representatives"
        | "Provincial Assembly"
      controversy_severity: "Low" | "Moderate" | "High" | "Critical"
      controversy_status_enum:
        | "Alleged"
        | "Investigating"
        | "Under Trial"
        | "Proven"
        | "Dismissed"
        | "Appealed"
      edit_status: "Pending" | "Approved" | "Denied"
      election_method:
        | "FPTP"
        | "PR"
        | "Nominated"
        | "National Assembly Member Election"
        | "By-Election"
      election_type_enum:
        | "General"
        | "Provincial"
        | "Local"
        | "National Assembly"
        | "By-Election"
        | "Referendum"
      entity_type:
        | "Politician"
        | "Party"
        | "Promise"
        | "LegislativeBill"
        | "NewsArticle"
        | "Committee"
        | "Constituency"
        | "Controversy"
        | "Election"
        | "PositionTitle"
      gender_enum: "Male" | "Female"
      legislative_body_name:
        | "House of Representatives"
        | "National Assembly"
        | "Provincial Assembly Bagmati"
        | "Provincial Assembly Gandaki"
        | "Provincial Assembly Karnali"
        | "Provincial Assembly Koshi"
        | "Provincial Assembly Lumbini"
        | "Provincial Assembly Madhesh"
        | "Provincial Assembly Sudurpashchim"
      municipality_type:
        | "Metropolitan City"
        | "Sub-Metropolitan City"
        | "Municipality"
        | "Rural Municipality"
      promise_status:
        | "Pending"
        | "In Progress"
        | "Fulfilled"
        | "Broken"
        | "Overdue"
        | "Compromised"
      user_role: "User" | "Admin"
      vote_option: "Yea" | "Nay" | "Abstain" | "Absent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      bill_parliamentary_stage_enum: [
        "Tabled",
        "General Discussion",
        "Clause-wise Discussion",
        "Committee Deliberation",
        "Voting",
        "Passed by House",
        "Sent to Other House",
        "Joint Committee",
        "Presidential Authentication",
        "Gazetted",
      ],
      bill_status: [
        "Introduced",
        "In Committee",
        "Voting",
        "Passed",
        "Failed",
        "Authenticated",
        "Withdrawn",
      ],
      career_entry_type: [
        "Position Held",
        "Education",
        "Political Milestone",
        "Controversy Involvement",
        "Award/Recognition",
        "Other",
      ],
      constituency_type: [
        "Federal House of Representatives",
        "Provincial Assembly",
      ],
      controversy_severity: ["Low", "Moderate", "High", "Critical"],
      controversy_status_enum: [
        "Alleged",
        "Investigating",
        "Under Trial",
        "Proven",
        "Dismissed",
        "Appealed",
      ],
      edit_status: ["Pending", "Approved", "Denied"],
      election_method: [
        "FPTP",
        "PR",
        "Nominated",
        "National Assembly Member Election",
        "By-Election",
      ],
      election_type_enum: [
        "General",
        "Provincial",
        "Local",
        "National Assembly",
        "By-Election",
        "Referendum",
      ],
      entity_type: [
        "Politician",
        "Party",
        "Promise",
        "LegislativeBill",
        "NewsArticle",
        "Committee",
        "Constituency",
        "Controversy",
        "Election",
        "PositionTitle",
      ],
      gender_enum: ["Male", "Female"],
      legislative_body_name: [
        "House of Representatives",
        "National Assembly",
        "Provincial Assembly Bagmati",
        "Provincial Assembly Gandaki",
        "Provincial Assembly Karnali",
        "Provincial Assembly Koshi",
        "Provincial Assembly Lumbini",
        "Provincial Assembly Madhesh",
        "Provincial Assembly Sudurpashchim",
      ],
      municipality_type: [
        "Metropolitan City",
        "Sub-Metropolitan City",
        "Municipality",
        "Rural Municipality",
      ],
      promise_status: [
        "Pending",
        "In Progress",
        "Fulfilled",
        "Broken",
        "Overdue",
        "Compromised",
      ],
      user_role: ["User", "Admin"],
      vote_option: ["Yea", "Nay", "Abstain", "Absent"],
    },
  },
} as const
