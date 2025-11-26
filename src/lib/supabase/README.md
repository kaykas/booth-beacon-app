# Supabase Integration

This directory contains the Supabase client setup and TypeScript types for Booth Beacon.

## Files

- **`client.ts`**: Supabase client instances for browser and server-side use
- **`types.ts`**: TypeScript types matching the database schema from the PRD
- **`index.ts`**: Centralized exports for easy imports

## Usage

### Client-Side (Browser)

```typescript
import { supabase } from '@/lib/supabase';

// Example: Fetch all booths
const { data, error } = await supabase
  .from('booths')
  .select('*')
  .eq('status', 'active');
```

### Server-Side (API Routes, Server Components)

```typescript
import { createServerClient } from '@/lib/supabase';

// Example: Fetch booth by ID
const supabase = createServerClient();
const { data, error } = await supabase
  .from('booths')
  .select('*, operator:operators(*)')
  .eq('id', boothId)
  .single();
```

## Environment Variables

Make sure to set up your `.env.local` file with the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

See `.env.example` for the complete list of required environment variables.

## TypeScript Types

All database types are defined in `types.ts` based on the PRD schema:

- **Core types**: `Booth`, `Operator`, `MachineModel`, `CityGuide`
- **User interactions**: `BoothBookmark`, `BoothComment`, `BoothUserPhoto`, `Collection`
- **Crawler types**: `CrawlLog`, `PageCache`
- **Helper types**: `BoothWithOperator`, `BoothWithRelations`, `CollectionWithBooths`
- **Query types**: `BoothFilters`, `NearbyBoothsQuery`, `BoothSearchQuery`

## Database Schema

The types in this directory match the database schema defined in the PRD (lines 798-975):

- Uses PostGIS for geospatial queries
- Supports multiple photo types (analog, chemical, digital, instant)
- Tracks booth status (active, unverified, inactive, closed)
- Includes comprehensive source tracking and metadata
