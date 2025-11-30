# City Guides Seed Script - Summary

## What Was Created

Three files for seeding city guides into Booth Beacon:

### 1. `/scripts/seed-city-guides.ts` (Main Script)
**Size**: ~9KB | **Lines**: ~300

A comprehensive TypeScript seed script that:
- Queries active, operational booths with coordinates for 5 cities
- Scores booths based on quality (photos + analog machines)
- Orders booths by geographic proximity for efficient routes
- Generates city-specific content and tips
- Inserts curated guides into the `city_guides` table

### 2. `/scripts/run-seed-guides.sh` (Execution Helper)
**Size**: ~1KB | **Executable**: Yes

Bash script that:
- Checks for required environment variables
- Loads `.env.local` automatically
- Runs the TypeScript seed script with `tsx`
- Provides clear error messages

### 3. `/scripts/CITY-GUIDES-README.md` (Documentation)
**Size**: ~6KB | **Comprehensive**: Yes

Complete documentation covering:
- Feature overview and capabilities
- Booth selection criteria
- Step-by-step process explanation
- Usage instructions (3 methods)
- Troubleshooting guide
- Customization examples

## Quick Usage

### Method 1: npm script (Recommended)
```bash
npm run seed:guides
```

### Method 2: Shell script
```bash
./scripts/run-seed-guides.sh
```

### Method 3: Direct execution
```bash
npx tsx scripts/seed-city-guides.ts
```

## Cities Included

| City | Country | Expected Booths | Route Focus |
|------|---------|----------------|-------------|
| New York | USA | 5-10 | Manhattan → Brooklyn |
| Berlin | Germany | 5-10 | Mitte → Kreuzberg |
| London | UK | 5-10 | East London & Soho |
| Los Angeles | USA | 5-10 | Silver Lake, Echo Park |
| Chicago | USA | 5-10 | Logan Square, Wicker Park |

## Features Highlights

### Smart Curation Algorithm
```typescript
// Scoring system
score =
  (has_photo ? 2 points : 0) +
  (is_analog_or_chemical ? 3 points : 0)

// Selection
- Take top 5-10 booths by score
- Must have coordinates
- Must be active + operational
```

### Route Optimization
Uses Haversine formula to calculate distances and orders booths by geographic proximity, creating efficient walking/transit routes.

### City-Specific Content
Each guide includes:
- Unique title: "The Ultimate [City] Photo Booth Tour"
- Custom description highlighting local booth scene
- Tailored tips (transport, timing, cash, neighborhoods)
- Estimated time based on booth count (~35 min/booth)

## Database Integration

**Table**: `city_guides`

**Upsert Strategy**: Conflict on `slug` field
- Safe to run multiple times
- Updates existing guides
- No duplicates created

**Access**: Immediate via `/guides/[city-slug]`

## Technical Details

### Dependencies
- `@supabase/supabase-js` (already in project)
- `tsx` (already installed, v4.21.0)
- Node.js v24.1.0 (verified)

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key  # Not anon key!
```

### TypeScript Configuration
- Excluded from main tsconfig.json (scripts/** pattern)
- Uses ES2020 target
- Runs via `tsx` without compilation

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

============================================================
📊 Summary
============================================================
✅ Guides created: 5
⏭️  Cities skipped: 0
📖 Total guides: 5

🎉 City guides seeded successfully!
   View them at: /guides/[city-slug]
```

## Next Steps After Running

1. **Verify guides in database**
   ```sql
   SELECT city, title, array_length(booth_ids, 1) as booth_count
   FROM city_guides
   WHERE published = true;
   ```

2. **Test guide pages**
   - Visit `/guides/new-york`
   - Check booth order makes sense
   - Verify map displays correctly

3. **Optional enhancements**
   - Add hero images via database update
   - Fine-tune tips based on local knowledge
   - Add route polylines for better map visualization

## Customization Examples

### Add More Cities
Edit `CITIES` array in `seed-city-guides.ts`:
```typescript
const CITIES = [
  { name: 'Paris', country: 'France', state: null },
  { name: 'Tokyo', country: 'Japan', state: null },
  // Add your cities
];
```

### Adjust Selection Criteria
Modify scoring in `fetchBoothsForCity()`:
```typescript
score:
  (booth.photo_exterior_url ? 2 : 0) +
  (booth.booth_type === 'analog' ? 3 : 0) +
  (booth.photo_sample_strips?.length ? 1 : 0)  // Add this
```

### Change Booth Limits
```typescript
// Currently: 5-10 booths
const selectedBooths = scoredBooths
  .slice(0, Math.min(10, scoredBooths.length))  // Change 10 to desired max
  .map((sb) => sb.booth);

if (booths.length < 5) {  // Change 5 to desired min
  // Skip city
}
```

## Files Created

```
/scripts/
├── seed-city-guides.ts          (Main seed script)
├── run-seed-guides.sh           (Execution helper)
├── CITY-GUIDES-README.md        (Full documentation)
└── SEED-GUIDES-SUMMARY.md       (This file)
```

## Package.json Update

Added npm script for convenience:
```json
"scripts": {
  "seed:guides": "tsx scripts/seed-city-guides.ts"
}
```

## Success Criteria

Script is ready to run when:
- ✅ Files created and executable
- ✅ Dependencies available (tsx installed)
- ✅ Environment variables set in `.env.local`
- ✅ Database has booth data for target cities
- ✅ `city_guides` table exists in database

## Support & Troubleshooting

See `CITY-GUIDES-README.md` for:
- Detailed troubleshooting guide
- Common issues and solutions
- Customization examples
- Database query tips

---

**Ready to run**: `npm run seed:guides`
