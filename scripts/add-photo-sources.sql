-- Add photo-rich sources for booth enrichment
-- Instagram location tags, Flickr geotagged photos, Google Maps reviews

INSERT INTO crawl_sources (
  source_name,
  source_url,
  source_type,
  extractor_type,
  enabled,
  priority,
  crawl_frequency_days,
  country_focus,
  notes,
  created_at,
  updated_at
) VALUES
  -- Instagram hashtag searches (photo-rich)
  (
    'Instagram #photobooth NYC',
    'https://www.instagram.com/explore/tags/photobooth/',
    'social_media',
    'instagram',
    true,
    85,
    7,
    'US',
    'High-quality user photos of photo booths in NYC. Extract: photos, location tags, captions',
    NOW(),
    NOW()
  ),
  (
    'Instagram #photoautomat Berlin',
    'https://www.instagram.com/explore/tags/photoautomat/',
    'social_media',
    'instagram',
    true,
    85,
    7,
    'DE',
    'German photo booth photos with location tags',
    NOW(),
    NOW()
  ),
  (
    'Instagram #photomaton Paris',
    'https://www.instagram.com/explore/tags/photomaton/',
    'social_media',
    'instagram',
    true,
    85,
    7,
    'FR',
    'French photo booth photos with location tags',
    NOW(),
    NOW()
  ),

  -- Flickr groups and tags (historical + current photos)
  (
    'Flickr Photobooths Pool',
    'https://www.flickr.com/groups/photobooths/pool/',
    'social_media',
    'flickr',
    true,
    80,
    14,
    'GLOBAL',
    'Large community-curated collection of photo booth photos with EXIF data and location tags',
    NOW(),
    NOW()
  ),
  (
    'Flickr Classic Photobooths',
    'https://www.flickr.com/search/?text=classic%20photobooth&license=1%2C2%2C3%2C4%2C5%2C6',
    'social_media',
    'flickr',
    true,
    75,
    14,
    'GLOBAL',
    'Creative Commons licensed photos of vintage analog photo booths',
    NOW(),
    NOW()
  ),

  -- Pinterest boards (curated photo collections)
  (
    'Pinterest Photo Booth Locations',
    'https://www.pinterest.com/search/pins/?q=photo%20booth%20location',
    'social_media',
    'pinterest',
    true,
    70,
    21,
    'GLOBAL',
    'User-curated pins showing photo booth locations with images',
    NOW(),
    NOW()
  ),

  -- Reddit communities (user reports with photos)
  (
    'Reddit r/photobooth',
    'https://www.reddit.com/r/photobooth/',
    'community',
    'reddit',
    true,
    75,
    7,
    'GLOBAL',
    'Active community sharing photo booth finds with photos and locations',
    NOW(),
    NOW()
  ),
  (
    'Reddit r/analog Photobooth Posts',
    'https://www.reddit.com/r/analog/search/?q=photobooth',
    'community',
    'reddit',
    true,
    70,
    14,
    'GLOBAL',
    'Analog photography community sharing photobooth experiences',
    NOW(),
    NOW()
  );

-- Update existing Flickr source if it exists
UPDATE crawl_sources
SET
  enabled = true,
  priority = 80,
  crawl_frequency_days = 14,
  notes = 'Re-enabled: High-quality photo source for booth enrichment'
WHERE source_name = 'Flickr Photobooth Group'
  AND enabled = false;

-- Report
SELECT
  'Photo-Rich Sources Added/Updated' as status,
  COUNT(*) as count
FROM crawl_sources
WHERE source_type IN ('social_media', 'community')
  AND enabled = true
  AND notes LIKE '%photo%';
