-- Booth Beacon Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  instagram TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Operators table
CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  story TEXT,
  founded_year INTEGER,
  city TEXT,
  country TEXT,
  instagram TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators are viewable by everyone" ON operators FOR SELECT USING (true);

-- Machine models table
CREATE TABLE IF NOT EXISTS machine_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  model_name TEXT NOT NULL,
  manufacturer TEXT,
  years_produced TEXT,
  description TEXT,
  notable_features TEXT[],
  photo_url TEXT,
  collector_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE machine_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Machine models are viewable by everyone" ON machine_models FOR SELECT USING (true);

-- Booths table
CREATE TABLE IF NOT EXISTS booths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Machine details
  machine_model TEXT,
  machine_year INTEGER,
  machine_manufacturer TEXT,
  machine_serial TEXT,
  booth_type TEXT CHECK (booth_type IN ('analog', 'chemical', 'digital', 'instant')),
  photo_type TEXT CHECK (photo_type IN ('black-and-white', 'color', 'both')),

  -- Operator
  operator_id UUID REFERENCES operators(id),
  operator_name TEXT,

  -- Photos
  photo_exterior_url TEXT,
  photo_interior_url TEXT,
  photo_sample_strips TEXT[],
  ai_preview_url TEXT,
  ai_preview_generated_at TIMESTAMPTZ,

  -- Operational
  status TEXT CHECK (status IN ('active', 'unverified', 'inactive', 'closed')) DEFAULT 'unverified',
  is_operational BOOLEAN DEFAULT true,
  hours TEXT,
  cost TEXT,
  accepts_cash BOOLEAN DEFAULT true,
  accepts_card BOOLEAN DEFAULT false,

  -- Content
  description TEXT,
  historical_notes TEXT,
  access_instructions TEXT,
  features TEXT[],

  -- Source tracking
  source_primary TEXT,
  source_urls TEXT[],
  source_verified_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified TIMESTAMPTZ
);

ALTER TABLE booths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Booths are viewable by everyone" ON booths FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX booths_city_idx ON booths(city);
CREATE INDEX booths_country_idx ON booths(country);
CREATE INDEX booths_status_idx ON booths(status);
CREATE INDEX booths_location_idx ON booths(latitude, longitude);

-- City guides table
CREATE TABLE IF NOT EXISTS city_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  hero_image_url TEXT,
  estimated_time TEXT,
  booth_ids UUID[],
  route_polyline TEXT,
  tips TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE city_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published city guides are viewable by everyone"
  ON city_guides FOR SELECT
  USING (published = true);

-- Booth bookmarks table
CREATE TABLE IF NOT EXISTS booth_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booth_id UUID REFERENCES booths(id) ON DELETE CASCADE NOT NULL,
  collection_id UUID,
  notes TEXT,
  visited BOOLEAN DEFAULT false,
  visited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, booth_id)
);

ALTER TABLE booth_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookmarks"
  ON booth_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON booth_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON booth_bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON booth_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- Booth comments table
CREATE TABLE IF NOT EXISTS booth_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booth_id UUID REFERENCES booths(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE booth_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone" ON booth_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON booth_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON booth_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON booth_comments FOR DELETE USING (auth.uid() = user_id);

-- Booth user photos table
CREATE TABLE IF NOT EXISTS booth_user_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booth_id UUID REFERENCES booths(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  moderation_status TEXT CHECK (moderation_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE booth_user_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved photos are viewable by everyone"
  ON booth_user_photos FOR SELECT
  USING (moderation_status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can upload photos"
  ON booth_user_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos"
  ON booth_user_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos"
  ON booth_user_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to booths table
CREATE TRIGGER update_booths_updated_at
    BEFORE UPDATE ON booths
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to profiles table
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - you can remove this if you want to start fresh)
INSERT INTO booths (name, slug, address, city, country, latitude, longitude, machine_model, booth_type, photo_type, status, is_operational, description)
VALUES
  ('Photo Booth at U-Bahn Warschauer Straße', 'warschauer-photo-booth', 'Warschauer Str., 10243 Berlin', 'Berlin', 'Germany', 52.5057, 13.4491, 'Photo-Me Model 9', 'analog', 'black-and-white', 'active', true, 'Classic photo booth in the Warschauer Straße U-Bahn station.'),
  ('Times Square Photo Booth', 'times-square-booth', '1560 Broadway, New York, NY 10036', 'New York', 'USA', 40.7580, -73.9855, 'Photomatic Deluxe', 'analog', 'both', 'active', true, 'Vintage photo booth in the heart of Times Square.'),
  ('Camden Market Photo Booth', 'camden-market-booth', 'Camden Lock Pl, London NW1 8AF', 'London', 'UK', 51.5414, -0.1466, 'Photo-Me Model 11', 'analog', 'black-and-white', 'active', true, 'Popular photo booth at Camden Market.')
ON CONFLICT (slug) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE 'You can now run your app with: npm run dev';
END $$;
