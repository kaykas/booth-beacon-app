/**
 * TypeScript types for Booth Beacon database schema
 * Based on the PRD database schema (lines 798-975)
 */

// ============================================================================
// Enum Types
// ============================================================================

export type BoothStatus = 'active' | 'unverified' | 'inactive' | 'closed';
export type BoothType = 'analog' | 'chemical' | 'digital' | 'instant';
export type PhotoType = 'black-and-white' | 'color' | 'both';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

// ============================================================================
// Core Table Types
// ============================================================================

export interface Booth {
  // Primary fields
  id: string;
  name: string;
  slug: string | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinates: string | null; // PostGIS GEOGRAPHY(POINT)

  // Machine details
  machine_model: string | null;
  machine_year: number | null;
  machine_manufacturer: string | null;
  machine_serial: string | null;
  booth_type: BoothType | null;
  photo_type: PhotoType | null;

  // Operator
  operator_id: string | null;
  operator_name: string | null;

  // Photos
  photo_exterior_url: string | null;
  photo_interior_url: string | null;
  photo_sample_strips: string[] | null;
  ai_preview_url: string | null;
  ai_preview_generated_at: string | null;
  ai_generated_image_url: string | null;
  ai_image_prompt: string | null;
  ai_image_generated_at: string | null;

  // Operational
  status: BoothStatus;
  is_operational: boolean;
  hours: string | null;
  cost: string | null;
  accepts_cash: boolean;
  accepts_card: boolean;

  // Content
  description: string | null;
  historical_notes: string | null;
  access_instructions: string | null;
  features: string[] | null;

  // Source tracking
  source_primary: string | null;
  source_urls: string[] | null;
  source_verified_date: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
  last_verified: string | null;
}

export interface Operator {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  story: string | null;
  founded_year: number | null;
  city: string | null;
  country: string | null;
  instagram: string | null;
  created_at: string;
}

export interface MachineModel {
  id: string;
  slug: string;
  model_name: string;
  manufacturer: string | null;
  years_produced: string | null;
  description: string | null;
  notable_features: string[] | null;
  photo_url: string | null;
  collector_notes: string | null;
  created_at: string;
}

export interface CityGuide {
  id: string;
  slug: string;
  city: string;
  country: string;
  title: string;
  description: string | null;
  hero_image_url: string | null;
  estimated_time: string | null;
  booth_ids: string[] | null;
  route_polyline: string | null;
  tips: string | null;
  published: boolean;
  created_at: string;
}

// ============================================================================
// User Interaction Types
// ============================================================================

export interface BoothBookmark {
  id: string;
  user_id: string;
  booth_id: string;
  collection_id: string | null;
  notes: string | null;
  visited: boolean;
  visited_at: string | null;
  created_at: string;
}

export interface BoothComment {
  id: string;
  user_id: string;
  booth_id: string;
  content: string;
  rating: number; // 1-5
  created_at: string;
}

export interface BoothUserPhoto {
  id: string;
  user_id: string;
  booth_id: string;
  photo_url: string;
  caption: string | null;
  moderation_status: ModerationStatus;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

// ============================================================================
// Crawler Infrastructure Types
// ============================================================================

export interface CrawlLog {
  id: string;
  source_id: string | null;
  source_name: string | null;
  crawl_session_id: string | null;
  operation_type: string | null;
  operation_status: string | null;
  pages_crawled: number | null;
  booths_extracted: number | null;
  booths_validated: number | null;
  error_message: string | null;
  created_at: string;
}

export interface PageCache {
  id: string;
  source_name: string | null;
  page_url: string | null;
  content_hash: string | null;
  html_content: string | null;
  markdown_content: string | null;
  crawled_at: string;
}

// ============================================================================
// Database Schema Type
// ============================================================================

export interface Database {
  public: {
    Tables: {
      booths: {
        Row: Booth;
        Insert: Omit<Booth, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Booth, 'id' | 'created_at'>>;
      };
      operators: {
        Row: Operator;
        Insert: Omit<Operator, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Operator, 'id' | 'created_at'>>;
      };
      machine_models: {
        Row: MachineModel;
        Insert: Omit<MachineModel, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<MachineModel, 'id' | 'created_at'>>;
      };
      city_guides: {
        Row: CityGuide;
        Insert: Omit<CityGuide, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<CityGuide, 'id' | 'created_at'>>;
      };
      booth_bookmarks: {
        Row: BoothBookmark;
        Insert: Omit<BoothBookmark, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<BoothBookmark, 'id' | 'created_at'>>;
      };
      booth_comments: {
        Row: BoothComment;
        Insert: Omit<BoothComment, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<BoothComment, 'id' | 'created_at'>>;
      };
      booth_user_photos: {
        Row: BoothUserPhoto;
        Insert: Omit<BoothUserPhoto, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<BoothUserPhoto, 'id' | 'created_at'>>;
      };
      collections: {
        Row: Collection;
        Insert: Omit<Collection, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Collection, 'id' | 'created_at'>>;
      };
      crawl_logs: {
        Row: CrawlLog;
        Insert: Omit<CrawlLog, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<CrawlLog, 'id' | 'created_at'>>;
      };
      page_cache: {
        Row: PageCache;
        Insert: Omit<PageCache, 'id' | 'crawled_at'> & {
          id?: string;
          crawled_at?: string;
        };
        Update: Partial<Omit<PageCache, 'id' | 'crawled_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: {
          user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      booth_status: BoothStatus;
      booth_type: BoothType;
      photo_type: PhotoType;
      moderation_status: ModerationStatus;
    };
  };
}

// ============================================================================
// Helper Types for API Responses
// ============================================================================

export interface BoothWithOperator extends Booth {
  operator?: Operator | null;
}

export interface BoothWithRelations extends Booth {
  operator?: Operator | null;
  machine_model_data?: MachineModel | null;
  user_photos?: BoothUserPhoto[];
  comments?: BoothComment[];
}

export interface CollectionWithBooths extends Collection {
  booths?: Booth[];
  booth_count?: number;
}

// ============================================================================
// Filter and Query Types
// ============================================================================

export interface BoothFilters {
  city?: string;
  country?: string;
  status?: BoothStatus[];
  photo_type?: PhotoType[];
  machine_model?: string;
  operator_id?: string;
  accepts_cash?: boolean;
  accepts_card?: boolean;
  is_operational?: boolean;
  search?: string;
}

export interface NearbyBoothsQuery {
  latitude: number;
  longitude: number;
  radius_km?: number;
  limit?: number;
  filters?: BoothFilters;
}

export interface BoothSearchQuery {
  query: string;
  limit?: number;
  offset?: number;
  filters?: BoothFilters;
}
