# Geocoding Service Setup

## Overview
This geocoding service adds missing latitude/longitude coordinates to booths using OpenStreetMap's Nominatim API.

## Files Created

1. **Supabase Edge Function**: `/supabase/functions/geocode-booths/index.ts`
   - Handles geocoding requests with SSE streaming
   - Respects Nominatim rate limits (1 req/sec)
   - Supports dry-run mode for testing

2. **API Route**: `/src/app/api/admin/geocode/route.ts`
   - Proxies requests to Edge Function
   - Handles authentication

3. **React Component**: `/src/components/admin/GeocodingPanel.tsx`
   - Full UI with progress tracking
   - Real-time status updates
   - Results display

4. **Utility Functions**: `/src/lib/geocoding.ts`
   - Helper functions for geocoding operations

## Integration Steps

### Step 1: Add Geocoding Tab to Admin Page

Add the following to `/src/app/admin/page.tsx`:

```typescript
// Import the component
import { GeocodingPanel } from '@/components/admin/GeocodingPanel';

// Add tab trigger (in TabsList)
<TabsTrigger value="geocoding" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
  <Navigation className="w-4 h-4 mr-2" />
  Geocoding
</TabsTrigger>

// Add tab content (after other TabsContent components)
<TabsContent value="geocoding" className="mt-6">
  <GeocodingPanel />
</TabsContent>
```

### Step 2: Deploy Edge Function

```bash
# Navigate to project root
cd /Users/jkw/Projects/booth-beacon-app

# Deploy the geocoding function to Supabase
npx supabase functions deploy geocode-booths

# Or if using Supabase CLI directly:
supabase functions deploy geocode-booths
```

### Step 3: Set Function Permissions

In Supabase Dashboard:
1. Go to Edge Functions
2. Find `geocode-booths` function
3. Set appropriate permissions (admin only recommended)

## Usage

### From Admin Dashboard

1. Navigate to Admin Dashboard
2. Click on "Geocoding" tab
3. View count of booths missing coordinates
4. Click "Test (Dry Run)" to preview results without updating database
5. Click "Start Geocoding (50 booths)" to geocode and update database
6. Monitor real-time progress and results

### Features

- **Real-time Progress**: Live updates via Server-Sent Events
- **Rate Limiting**: Automatic 1 request/second to respect Nominatim policy
- **Error Handling**: Graceful handling of missing data or API errors
- **Dry Run Mode**: Test without making database changes
- **Results Display**: Last 20 results shown in real-time
- **Statistics**: Success/error/skipped counts

## API Details

### OpenStreetMap Nominatim

- **Endpoint**: `https://nominatim.openstreetmap.org/search`
- **Rate Limit**: 1 request per second
- **Cost**: Free, no API key required
- **Usage Policy**: Must include User-Agent header

### Query Format

The function constructs queries as:
```
{address}, {city}, {country}
```

Example: `123 Main St, New York, United States`

## Troubleshooting

### No coordinates found
- Address may be incomplete or incorrectly formatted
- Try improving address quality in database
- Consider manual geocoding for problematic addresses

### Rate limit errors
- Function automatically waits 1 second between requests
- If errors persist, check Nominatim status

### Connection errors
- Check Supabase Edge Function logs
- Verify environment variables are set correctly
- Ensure function is deployed and running

## Future Enhancements

- [ ] Batch processing with configurable batch sizes
- [ ] CSV export of geocoding results
- [ ] Manual coordinate override from admin panel
- [ ] Alternative geocoding providers (Google Maps, Mapbox)
- [ ] Coordinate validation and accuracy scoring
- [ ] Automatic retry for failed geocodes
