# photobooth.net Extraction Fix

## Root Cause Analysis

### Problem
The crawler was returning 0 booths from photobooth.net despite the site having hundreds of booth listings.

### Investigation Steps
1. **Reviewed Firecrawl documentation** - Confirmed extract() method was being used correctly
2. **Scraped the target URL** - Used Firecrawl's `scrapeUrl()` to analyze page structure
3. **Analyzed page content** - Discovered the issue

### Root Cause
**The URL in crawl_sources table was pointing to the WRONG PAGE!**

Current URL: `https://www.photobooth.net/locations/?includeInactiveBooths=1`
- This is just a landing/index page
- Contains only 3 "RECENT ADDITIONS" booths
- Rest is informational content about photobooths
- Does NOT contain the full booth directory

### Correct URLs
The site has THREE ways to access all booths:

1. **Browse All Page** (RECOMMENDED):
   ```
   http://www.photobooth.net/locations/browse.php?ddState=0
   ```
   - Shows all booth listings in a table/list format
   - Mentioned on landing page: "If you'd like to see all our listings, just hit 'Go' without selecting a state"

2. **Map View**:
   ```
   https://www.photobooth.net/locations/map.php
   ```
   - Shows all booths on an interactive map
   - May require JavaScript rendering

3. **Individual Booth Pages**:
   ```
   https://www.photobooth.net/locations/index.php?locationID=856
   ```
   - Detailed info for each booth
   - Would require crawling hundreds of pages

## Solution

### Step 1: Update crawl_sources table
Change the `source_url` from the landing page to the browse page:

```sql
UPDATE crawl_sources
SET source_url = 'http://www.photobooth.net/locations/browse.php?ddState=0'
WHERE name = 'photobooth.net';
```

### Step 2: Test extraction
Run the crawler again with the updated URL to verify booths are extracted successfully.

### Step 3 (Optional): Consider using Firecrawl's crawl() method
If the browse page is paginated or if we want to capture individual booth details, we could use Firecrawl's `crawl()` method with a wildcard pattern:

```typescript
const crawlResult = await firecrawl.crawl('http://www.photobooth.net/locations/', {
  includePaths: ['/browse.php*', '/index.php?locationID=*'],
  maxDepth: 2,
  limit: 500,
});
```

## Expected Outcome
After implementing this fix, the crawler should successfully extract all booth listings from photobooth.net.

## Lessons Learned
1. **Always verify the target URL contains the actual data** - Don't assume landing pages have listings
2. **Read the page content carefully** - The site explicitly told us where the full directory was!
3. **Scrape first, extract second** - Using `scrapeUrl()` to inspect structure before `extract()` saves debugging time
