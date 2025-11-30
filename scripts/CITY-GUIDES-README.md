# City Guides Seeder

Automatically creates curated photo booth tour guides for major cities.

## Overview

The city guides seeder (`seed-city-guides.ts`) queries your booth database and creates optimized walking/transit routes through the best analog photo booths in each city.

## Features

- **Smart Curation**: Selects 5-10 high-quality booths per city
- **Quality Scoring**: Prioritizes booths with photos and analog machines
- **Route Optimization**: Orders booths by geographic proximity for efficient touring
- **City-Specific Tips**: Includes local advice for each city
- **Automatic Time Estimates**: Calculates tour duration based on booth count

## Cities Included

1. **New York, USA** - Manhattan & Brooklyn
2. **Berlin, Germany** - Mitte, Kreuzberg, Friedrichshain
3. **London, UK** - East London & Soho
4. **Los Angeles, USA** - Silver Lake, Echo Park, etc.
5. **Chicago, USA** - Logan Square, Wicker Park

## Booth Selection Criteria

The script queries booths with the following filters:

- ✅ `status = 'active'`
- ✅ `is_operational = true`
- ✅ Has coordinates (latitude & longitude)
- ⭐ **Bonus points for**:
  - Has exterior photo (`photo_exterior_url`)
  - Booth type is `analog` or `chemical`

## How It Works

### 1. Query Phase
For each city, the script:
- Queries active, operational booths with coordinates
- Scores booths based on photo availability and machine type
- Selects top 5-10 booths (or skips if fewer than 5)

### 2. Route Optimization
- Orders selected booths by geographic proximity
- Uses Haversine formula to calculate distances
- Creates efficient walking/transit route

### 3. Content Generation
- **Title**: "The Ultimate [City] Photo Booth Tour"
- **Description**: Brief intro about analog booths in the city
- **Estimated Time**: Calculated as ~35 min per booth + travel time
- **Tips**: City-specific advice (2-4 bullet points)

### 4. Database Insert
- Upserts guide into `city_guides` table
- Sets `published = true` for immediate visibility
- Uses city slug for unique identification

## Usage

### Quick Start

```bash
# From project root
./scripts/run-seed-guides.sh
```

### Direct Execution

```bash
# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Run with tsx
npx tsx scripts/seed-city-guides.ts
```

### Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Output Example

```
🌱 Booth Beacon City Guides Seeder
===================================

Creating guides for 5 cities...

============================================================
📖 Creating guide for New York, USA
============================================================

🔍 Querying booths for New York, USA...
📍 Found 23 active booths with coordinates
✨ Selected 10 high-quality booths
   - With photos: 8
   - Analog/Chemical: 9

🗺️  Ordering booths by geographic proximity...

📝 Guide details:
   Title: The Ultimate New York Photo Booth Tour
   Booths: 10
   Estimated time: 5-6 hours
   Slug: new-york

✅ Successfully created guide for New York!
   Route order:
   1. Sunken Hundred
   2. Baby's All Right
   3. Bossa Nova Civic Club
   ...
```

## Database Schema

The script inserts records into the `city_guides` table:

```typescript
{
  id: UUID,                    // Auto-generated
  slug: string,                // URL slug (e.g., "new-york")
  city: string,                // City name
  country: string,             // Country name
  title: string,               // Guide title
  description: string,         // Brief description
  hero_image_url?: string,     // Optional hero image
  estimated_time: string,      // e.g., "3-4 hours"
  booth_ids: UUID[],           // Array of booth IDs in route order
  route_polyline?: string,     // Optional polyline for map
  tips: string,                // Multi-line local tips
  published: boolean,          // Always true for seeded guides
  created_at: timestamp        // Auto-generated
}
```

## Guide Access

After seeding, guides are immediately accessible at:

```
/guides/new-york
/guides/berlin
/guides/london
/guides/los-angeles
/guides/chicago
```

## Customization

### Adding More Cities

Edit the `CITIES` array in `seed-city-guides.ts`:

```typescript
const CITIES = [
  { name: 'New York', country: 'USA', state: 'NY' },
  { name: 'Paris', country: 'France', state: null },
  // Add your cities here
];
```

### Adjusting Selection Criteria

Modify the scoring logic in `fetchBoothsForCity()`:

```typescript
const scoredBooths = data.map((booth) => ({
  booth: booth as Booth,
  score:
    (booth.photo_exterior_url ? 2 : 0) +
    (booth.booth_type === 'analog' || booth.booth_type === 'chemical' ? 3 : 0)
    // Add your custom scoring logic
}));
```

### Custom City Tips

Update the `generateCityTips()` function:

```typescript
function generateCityTips(city: string): string {
  const tipsMap: Record<string, string> = {
    'Your City': `• Custom tip 1
• Custom tip 2
• Custom tip 3`,
    // Add more cities
  };
  // ...
}
```

## Troubleshooting

### No booths found for a city

**Cause**: City name in database doesn't match exactly
**Solution**: Check exact city name in database with:
```sql
SELECT DISTINCT city, country FROM booths WHERE status = 'active';
```

### Guide skipped (fewer than 5 booths)

**Cause**: Not enough high-quality booths meet criteria
**Solution**:
- Lower minimum booth count in code
- Relax selection criteria
- Add more booths to database for that city

### Script fails with authentication error

**Cause**: Missing or invalid environment variables
**Solution**:
1. Check `.env.local` exists and is loaded
2. Verify `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
3. Ensure URL is correct

## Re-running the Script

The script uses `upsert` with conflict resolution on `slug`, so:
- ✅ Safe to run multiple times
- ✅ Updates existing guides
- ✅ Won't create duplicates

## Next Steps

After seeding:
1. ✅ View guides at `/guides/[city-slug]`
2. ✅ Check route order makes geographic sense
3. ✅ Update hero images via database if desired
4. ✅ Fine-tune tips based on local knowledge

## Support

For issues or questions:
- Check database has sufficient booth data
- Verify coordinates are accurate
- Review script output for specific errors
