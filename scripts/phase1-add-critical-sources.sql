-- ============================================================================
-- PHASE 1: Add 6 Critical Missing Core Sources
-- ============================================================================
-- Purpose: Implement the Master Crawler Strategy Phase 1
-- Expected Impact: +150-250 verified analog booths
-- Target Completion: Week 1
-- ============================================================================

-- 1. Classic Photo Booth Network (NYC/Philly) - CRITICAL
-- NOTE: Use classicphotobooth.NET, not .COM
INSERT INTO crawl_sources (
  source_name,
  source_url,
  source_type,
  priority,
  enabled,
  notes,
  created_at,
  updated_at
)
VALUES (
  'Classic Photo Booth Network',
  'https://classicphotobooth.net/locations-2/',
  'DIRECTORY',
  1,
  true,
  'Major East Coast restoration network (NYC/Philadelphia). Expected yield: 30-50 verified analog booths. NOTE: Use .net domain, not .com. Community-trusted source for chemical booth locations.',
  NOW(),
  NOW()
)
ON CONFLICT (source_url) DO UPDATE SET
  enabled = true,
  priority = 1,
  notes = 'Major East Coast restoration network (NYC/Philadelphia). Expected yield: 30-50 verified analog booths. NOTE: Use .net domain, not .com. Community-trusted source for chemical booth locations.',
  updated_at = NOW();

-- 2. Photomatica (San Francisco/Los Angeles) - CRITICAL
INSERT INTO crawl_sources (
  source_name,
  source_url,
  source_type,
  priority,
  enabled,
  notes,
  created_at,
  updated_at
)
VALUES (
  'Photomatica - West Coast Network',
  'https://photomatica.com/locations',
  'DIRECTORY',
  1,
  true,
  'San Francisco and Los Angeles vintage booth network. Expected yield: 20-40 locations. IMPORTANT: Filter for "Vintage" or "Public" booths only (exclude digital event rentals). High-quality chemical booth source.',
  NOW(),
  NOW()
)
ON CONFLICT (source_url) DO UPDATE SET
  enabled = true,
  priority = 1,
  notes = 'San Francisco and Los Angeles vintage booth network. Expected yield: 20-40 locations. IMPORTANT: Filter for "Vintage" or "Public" booths only (exclude digital event rentals). High-quality chemical booth source.',
  updated_at = NOW();

-- 3. Louie Despres Photobooth Project (USA Nationwide) - HIGH
INSERT INTO crawl_sources (
  source_name,
  source_url,
  source_type,
  priority,
  enabled,
  notes,
  created_at,
  updated_at
)
VALUES (
  'Louie Despres Photobooth Project',
  'https://louiedespres.com/photobooth-project',
  'DIRECTORY',
  1,
  true,
  'USA nationwide "Dip & Dunk" tracker. LAST UPDATED: 2024 (verified current). Expected yield: 40-60 locations across United States. Specializes in chemical processing booths. Community-verified analog only.',
  NOW(),
  NOW()
)
ON CONFLICT (source_url) DO UPDATE SET
  enabled = true,
  priority = 1,
  notes = 'USA nationwide "Dip & Dunk" tracker. LAST UPDATED: 2024 (verified current). Expected yield: 40-60 locations across United States. Specializes in chemical processing booths. Community-verified analog only.',
  updated_at = NOW();

-- 4. Autofoto (London/Barcelona) - HIGH
INSERT INTO crawl_sources (
  source_name,
  source_url,
  source_type,
  priority,
  enabled,
  notes,
  created_at,
  updated_at
)
VALUES (
  'Autofoto - UK/Spain Network',
  'https://www.autofoto.org/locations',
  'DIRECTORY',
  1,
  true,
  'Rafael Hortala-Vallve network covering London and Barcelona. Major European analog booth operator. Expected yield: 20-40 locations. High-quality vintage booths with community validation.',
  NOW(),
  NOW()
)
ON CONFLICT (source_url) DO UPDATE SET
  enabled = true,
  priority = 1,
  notes = 'Rafael Hortala-Vallve network covering London and Barcelona. Major European analog booth operator. Expected yield: 20-40 locations. High-quality vintage booths with community validation.',
  updated_at = NOW();

-- 5. Fotoautomatica (Florence, Italy) - HIGH
INSERT INTO crawl_sources (
  source_name,
  source_url,
  source_type,
  priority,
  enabled,
  notes,
  created_at,
  updated_at
)
VALUES (
  'Fotoautomatica - Florence',
  'https://www.fotoautomatica.com/',
  'DIRECTORY',
  1,
  true,
  'Italian street booths concentrated in Florence. Expected yield: 15-25 locations. Famous for vintage analog machines in historic city locations. Tourist-friendly, well-maintained booths.',
  NOW(),
  NOW()
)
ON CONFLICT (source_url) DO UPDATE SET
  enabled = true,
  priority = 1,
  notes = 'Italian street booths concentrated in Florence. Expected yield: 15-25 locations. Famous for vintage analog machines in historic city locations. Tourist-friendly, well-maintained booths.',
  updated_at = NOW();

-- 6. Automatfoto (Stockholm, Sweden) - HIGH
INSERT INTO crawl_sources (
  source_name,
  source_url,
  source_type,
  priority,
  enabled,
  notes,
  created_at,
  updated_at
)
VALUES (
  'Automatfoto - Stockholm Network',
  'https://automatfoto.se/',
  'DIRECTORY',
  2,
  true,
  'Hidden Stockholm/Sweden network. Expected yield: 10-20 locations. Fills geographic gap in Scandinavia. Chemical booth focus, community-operated.',
  NOW(),
  NOW()
)
ON CONFLICT (source_url) DO UPDATE SET
  enabled = true,
  priority = 2,
  notes = 'Hidden Stockholm/Sweden network. Expected yield: 10-20 locations. Fills geographic gap in Scandinavia. Chemical booth focus, community-operated.',
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that all 6 sources were added/updated
SELECT
  source_name,
  source_url,
  enabled,
  priority,
  created_at
FROM crawl_sources
WHERE source_url IN (
  'https://classicphotobooth.net/locations-2/',
  'https://photomatica.com/locations',
  'https://louiedespres.com/photobooth-project',
  'https://www.autofoto.org/locations',
  'https://www.fotoautomatica.com/',
  'https://automatfoto.se/'
)
ORDER BY priority, source_name;

-- Count total enabled sources after Phase 1
SELECT
  COUNT(*) as total_sources,
  SUM(CASE WHEN enabled THEN 1 ELSE 0 END) as enabled_sources,
  SUM(CASE WHEN enabled = false THEN 1 ELSE 0 END) as disabled_sources
FROM crawl_sources;

-- Show geographic coverage before crawling new sources
SELECT
  country,
  COUNT(*) as booth_count,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as geocoded_count
FROM booths
GROUP BY country
ORDER BY booth_count DESC
LIMIT 10;

-- ============================================================================
-- POST-IMPLEMENTATION NOTES
-- ============================================================================
--
-- NEXT STEPS:
-- 1. Run this SQL script against the production database
-- 2. Verify all 6 sources appear in admin dashboard
-- 3. Test crawler on one source (start with Classic Photo Booth)
-- 4. Monitor SSE stream for extraction quality
-- 5. Enable remaining 5 sources once verified
--
-- MONITORING:
-- - Check booth yield after 24 hours
-- - Verify analog-only (no digital booth false positives)
-- - Monitor geocoding success rate
-- - Check for duplicates with existing booths
--
-- EXPECTED RESULTS (1 WEEK):
-- - Total booths: 912 → 1,050-1,150
-- - Enabled sources: 20 → 26
-- - Geographic coverage: Heavy Europe → Balanced USA/Europe
-- - USA booth count: Increase by 100-150
-- - Europe booth count: Increase by 50-100
--
-- ============================================================================
