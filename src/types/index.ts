// Core Booth type based on database schema
export interface Booth {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;

  // Machine details
  machine_model?: string;
  machine_year?: number;
  machine_manufacturer?: string;
  machine_serial?: string;
  booth_type?: 'analog' | 'chemical' | 'digital' | 'instant';
  photo_type?: 'black-and-white' | 'color' | 'both';

  // Operator
  operator_id?: string;
  operator_name?: string;
  operator?: Operator;

  // Photos
  photo_exterior_url?: string;
  photo_interior_url?: string;
  photo_sample_strips?: string[];
  ai_preview_url?: string;
  ai_preview_generated_at?: string;

  // Operational
  status: 'active' | 'unverified' | 'inactive' | 'closed';
  is_operational: boolean;
  hours?: string;
  phone?: string;
  cost?: string;
  accepts_cash: boolean;
  accepts_card: boolean;

  // Content
  description?: string;
  historical_notes?: string;
  access_instructions?: string;
  features?: string[];

  // Source tracking
  source_primary?: string;
  source_urls?: string[];
  source_verified_date?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  last_verified?: string;
}

// Operator type
export interface Operator {
  id: string;
  slug: string;
  name: string;
  logo_url?: string;
  website?: string;
  story?: string;
  founded_year?: number;
  city?: string;
  country?: string;
  instagram?: string;
  created_at: string;
}

// Machine model type
export interface MachineModel {
  id: string;
  slug: string;
  model_name: string;
  manufacturer?: string;
  years_produced?: string;
  description?: string;
  notable_features?: string[];
  photo_url?: string;
  collector_notes?: string;
  created_at: string;
}

// City guide type
export interface CityGuide {
  id: string;
  slug: string;
  city: string;
  country: string;
  title: string;
  description?: string;
  hero_image_url?: string;
  estimated_time?: string;
  booth_ids: string[];
  route_polyline?: string;
  tips?: string;
  published: boolean;
  created_at: string;
}

// User bookmark type
export interface BoothBookmark {
  id: string;
  user_id: string;
  booth_id: string;
  collection_id?: string;
  notes?: string;
  visited: boolean;
  visited_at?: string;
  created_at: string;
  booth?: Booth;
}

// Collection type
export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
}

// Comment/Review type
export interface BoothComment {
  id: string;
  user_id: string;
  booth_id: string;
  content: string;
  rating?: number;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

// User photo type
export interface BoothUserPhoto {
  id: string;
  user_id: string;
  booth_id: string;
  photo_url: string;
  caption?: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  booth?: {
    id: string;
    name: string;
    city: string;
    country: string;
  };
}

// Filter state type
export interface FilterState {
  location?: string;
  near_me?: boolean;
  photo_type?: ('black-and-white' | 'color' | 'both')[];
  machine_model?: string;
  operator?: string;
  status?: ('active' | 'unverified' | 'inactive' | 'closed')[];
  payment?: ('cash' | 'card')[];
  distance?: number;
}

// Map coordinates type
export interface Coordinates {
  lat: number;
  lng: number;
}

// Search result type
export interface SearchResult {
  type: 'booth' | 'city' | 'address';
  id: string;
  label: string;
  sublabel?: string;
  coordinates?: Coordinates;
}

// Stats type
export interface SiteStats {
  booth_count: number;
  country_count: number;
  city_count: number;
  verified_count: number;
}
