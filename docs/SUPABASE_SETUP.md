# Supabase Setup Complete

This document summarizes the Supabase setup for Booth Beacon.

## What Was Created

### 1. Dependencies Installed

```bash
npm install @supabase/supabase-js@2.86.0
```

### 2. Environment Files

- **`.env.local`**: Local environment variables (not committed to git)
- **`.env.example`**: Template for required environment variables (committed to git)

Both files include placeholders for:
- Supabase credentials (URL, anon key, service role key)
- Google APIs (Maps, Imagen)
- External APIs (Firecrawl, Anthropic)
- App configuration

### 3. Supabase Module (`src/lib/supabase/`)

#### Files Created:

| File | Purpose | Size |
|------|---------|------|
| `client.ts` | Browser and server Supabase clients | 1.2 KB |
| `types.ts` | TypeScript types matching PRD database schema | 8.8 KB |
| `index.ts` | Centralized exports | 181 B |
| `examples.ts` | Usage examples and common patterns | 7.3 KB |
| `README.md` | Documentation | 1.9 KB |

### 4. TypeScript Types

Complete type definitions for all database tables based on the PRD schema:

**Core Types:**
- `Booth` - Photo booth locations with full details
- `Operator` - Booth operators/owners
- `MachineModel` - Photo booth machine specifications
- `CityGuide` - Curated city walking tours

**User Interaction Types:**
- `BoothBookmark` - User saved booths
- `BoothComment` - Reviews and ratings
- `BoothUserPhoto` - User-submitted photos
- `Collection` - Custom bookmark collections

**Crawler Types:**
- `CrawlLog` - Crawler operation logs
- `PageCache` - Cached web pages

**Helper Types:**
- `BoothWithOperator` - Booth with operator details joined
- `BoothWithRelations` - Booth with all related data
- `CollectionWithBooths` - Collection with booth details
- `BoothFilters` - Filter criteria for booth queries
- `NearbyBoothsQuery` - Geospatial search parameters
- `BoothSearchQuery` - Full-text search parameters

**Enum Types:**
- `BoothStatus`: 'active' | 'unverified' | 'inactive' | 'closed'
- `BoothType`: 'analog' | 'chemical' | 'digital' | 'instant'
- `PhotoType`: 'black-and-white' | 'color' | 'both'
- `ModerationStatus`: 'pending' | 'approved' | 'rejected'

## How to Use

### Setup Instructions

1. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the URL, anon key, and service role key

2. **Update `.env.local`:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. **Import and use in your app:**

### Client-Side Usage (Client Components)

```typescript
import { supabase } from '@/lib/supabase';

// Fetch booths
const { data, error } = await supabase
  .from('booths')
  .select('*')
  .eq('status', 'active');
```

### Server-Side Usage (Server Components, API Routes)

```typescript
import { createServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('booths')
    .select('*');

  return Response.json(data);
}
```

### Using Types

```typescript
import type { Booth, BoothFilters } from '@/lib/supabase';

function BoothCard({ booth }: { booth: Booth }) {
  return (
    <div>
      <h2>{booth.name}</h2>
      <p>{booth.city}, {booth.country}</p>
    </div>
  );
}
```

## Examples

See `src/lib/supabase/examples.ts` for comprehensive examples including:
- Fetching booths with filters
- Searching by location
- Creating bookmarks
- Adding comments/reviews
- Server-side admin operations
- Operator and city guide queries
- Getting statistics

## Database Schema

The TypeScript types match the database schema defined in the PRD (lines 798-975):

- Uses PostGIS extension for geospatial queries
- Supports multiple booth types and photo formats
- Comprehensive status tracking and metadata
- User interactions (bookmarks, comments, photos)
- Crawler infrastructure for data collection

## Next Steps

1. **Create the database tables** in Supabase using the SQL schema from the PRD
2. **Set up Row Level Security (RLS)** policies for user data
3. **Create database functions** for geospatial queries (nearby booths)
4. **Configure storage buckets** for booth photos and AI previews
5. **Set up authentication** using Supabase Auth

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- Project PRD: `/PRD.md`
- Supabase Module README: `/src/lib/supabase/README.md`

## Security Notes

- `.env.local` is gitignored and never committed
- The service role key should ONLY be used server-side
- Use RLS policies to protect user data
- Never expose service role keys in client-side code
