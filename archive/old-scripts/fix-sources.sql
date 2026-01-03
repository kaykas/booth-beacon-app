-- Fix Booth Beacon Crawler Sources
-- Generated: 2025-11-30
-- Purpose: Update URLs, batch sizes, and configs for better extraction

-- =====================================================
-- PHASE 1: HIGH PRIORITY FIXES
-- =====================================================

-- 1. DISABLE DUPLICATE photobooth.net homepage source (keep locations)
UPDATE crawl_sources
SET enabled = false,
    notes = 'DISABLED: Duplicate source. Using /locations/ source instead which has full directory access.'
WHERE source_url = 'https://www.photobooth.net/'
AND source_name LIKE '%photobooth.net%';

-- 2. UPDATE photobooth.net/locations source for deep crawling
UPDATE crawl_sources
SET pages_per_batch = 100,
    total_pages_target = 1000,
    notes = 'UPDATED: Increased batch size to crawl deep directory. Should extract 500-800 booths.',
    priority = 100,
    crawl_frequency_days = 7,
    last_batch_page = 0,
    crawl_completed = false
WHERE source_url = 'https://www.photobooth.net/locations/'
AND source_name LIKE '%photobooth.net%';

-- 3. UPDATE autophoto.org - increase batch size and reset for retry
UPDATE crawl_sources
SET pages_per_batch = 50,
    total_pages_target = 200,
    notes = 'UPDATED: Increased waitFor to 15000ms (handled in code). JS map needs deep crawl.',
    priority = 95,
    crawl_frequency_days = 7,
    last_batch_page = 0,
    crawl_completed = false,
    consecutive_failures = 0
WHERE source_url LIKE '%autophoto.org%'
AND extractor_type IN ('autophoto', 'core');

-- 4. RESET city guide sources for re-crawl (Time Out LA, Block Club Chicago)
UPDATE crawl_sources
SET last_batch_page = 0,
    crawl_completed = false,
    consecutive_failures = 0,
    notes = 'RESET: Re-crawling to test AI extraction on article content.'
WHERE source_url IN (
    'https://www.timeout.com/los-angeles/news/vintage-photo-booths-are-having-a-moment-we-found-some-of-l-a-s-remaining-ones-121324',
    'https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed-meet-the-women-trying-to-keep-them-alive/'
);

-- =====================================================
-- PHASE 2: DIRECTORY SOURCES - INCREASE BATCH SIZES
-- =====================================================

-- Update Classic Photo Booth Network
UPDATE crawl_sources
SET pages_per_batch = 50,
    total_pages_target = 100,
    notes = 'UPDATED: Increased batch size for directory crawling'
WHERE source_url LIKE '%classicphotobooth.net%'
AND enabled = true;

-- Update Photomatica sources
UPDATE crawl_sources
SET pages_per_batch = 30,
    total_pages_target = 100,
    notes = 'UPDATED: Increased batch size for directory crawling'
WHERE source_url LIKE '%photomatica.com%'
AND enabled = true;

-- Update Lomography
UPDATE crawl_sources
SET pages_per_batch = 20,
    total_pages_target = 50,
    notes = 'UPDATED: Increased batch size for user-generated content'
WHERE source_url LIKE '%lomography.com%'
AND enabled = true;

-- Update European operators
UPDATE crawl_sources
SET pages_per_batch = 20,
    total_pages_target = 50
WHERE source_url LIKE ANY (ARRAY['%photoautomat.de%', '%fotoautomat%', '%automatfoto%'])
AND enabled = true
AND pages_per_batch < 20;

-- =====================================================
-- PHASE 3: CLEAN UP DUPLICATE/BAD SOURCES
-- =====================================================

-- Disable sources pointing to blog homepages (not location data)
UPDATE crawl_sources
SET enabled = false,
    notes = 'DISABLED: Homepage/blog URL, not location directory'
WHERE (
    (source_url ~ '^https?://[^/]+/?$' AND source_url !~ 'automatfoto|fotoautomat')  -- Homepage only
    OR source_url LIKE '%/blog%'
    OR source_url LIKE '%/news%'
    OR source_url LIKE '%/article%'
)
AND source_url NOT LIKE '%booth%'
AND source_url NOT LIKE '%location%'
AND enabled = true;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- View updated sources
SELECT
    source_name,
    source_url,
    enabled,
    pages_per_batch,
    total_pages_target,
    priority,
    notes
FROM crawl_sources
WHERE enabled = true
ORDER BY priority DESC, source_name;

-- Check sources that will be crawled with new configs
SELECT
    source_name,
    source_url,
    pages_per_batch,
    last_batch_page,
    crawl_completed,
    (SELECT COUNT(*) FROM booths WHERE booths.source_id = crawl_sources.id) as current_booth_count
FROM crawl_sources
WHERE enabled = true
AND (
    source_url LIKE '%photobooth.net/locations%'
    OR source_url LIKE '%autophoto.org%'
    OR source_url LIKE '%timeout.com%'
    OR source_url LIKE '%blockclub%'
)
ORDER BY priority DESC;
