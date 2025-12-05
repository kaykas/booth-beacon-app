# Test Implementation Guide - Booth Beacon

This guide provides concrete examples and step-by-step instructions for implementing the recommended tests.

---

## Part 1: Setup & Configuration

### Step 1: Update `tests/setup.ts`

The current setup is minimal. Enhance it with mock providers:

```typescript
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock Next.js navigation (for app router)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-key';

// Mock fetch if needed
global.fetch = vi.fn();
```

### Step 2: Update `vitest.config.ts`

Add coverage configuration and test paths:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: [
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/tests/e2e/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/supabase/functions/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.config.*',
        '**/*.d.ts',
        '**/types/**',
        'src/app/**/*.tsx', // Page components
        'src/components/ui/**', // UI primitives
      ],
      lines: 70,
      functions: 70,
      branches: 65,
      statements: 70,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Step 3: Create Test Factories

Create `/tests/factories/index.ts`:

```typescript
import { Booth } from '@/types';

export function mockBooth(overrides?: Partial<Booth>): Booth {
  return {
    id: 'booth-1',
    name: 'Test Booth',
    slug: 'test-booth',
    city: 'San Francisco',
    country: 'USA',
    state: 'California',
    address: '123 Main St',
    postal_code: '94105',
    latitude: 37.7749,
    longitude: -122.4194,
    phone: '555-0123',
    website: 'https://example.com',
    hours: 'Mon-Fri 10am-6pm',
    description: 'A test photo booth',
    status: 'active',
    is_operational: true,
    accepts_cash: true,
    accepts_card: true,
    photo_exterior_url: 'https://example.com/booth.jpg',
    photo_interior_url: 'https://example.com/interior.jpg',
    ai_preview_url: null,
    ai_generated_image_url: null,
    photos: [],
    google_place_id: 'place-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function mockBooths(count: number): Booth[] {
  return Array.from({ length: count }, (_, i) =>
    mockBooth({
      id: `booth-${i}`,
      name: `Booth ${i}`,
      slug: `booth-${i}`,
    })
  );
}

export const mockCoordinates = {
  nyc: { lat: 40.7128, lng: -74.006 },
  sf: { lat: 37.7749, lng: -122.4194 },
  la: { lat: 34.0522, lng: -118.2437 },
};
```

---

## Part 2: Testing Utilities (CRITICAL)

### Test 1: Distance Utils

Create `/src/lib/distanceUtils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  formatDistance,
  sortBoothsByDistance,
  filterBoothsByRadius,
} from '@/lib/distanceUtils';
import { mockBooth, mockBooths, mockCoordinates } from '@/tests/factories';

describe('distanceUtils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const distance = calculateDistance(mockCoordinates.nyc, mockCoordinates.sf);
      // New York to San Francisco is approximately 4,100 km
      expect(distance).toBeCloseTo(4100, -2);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(mockCoordinates.nyc, mockCoordinates.nyc);
      expect(distance).toBe(0);
    });

    it('should handle decimal precision', () => {
      const distance = calculateDistance(
        { lat: 0, lng: 0 },
        { lat: 0.001, lng: 0.001 }
      );
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1);
    });

    it('should work with negative coordinates', () => {
      const distance = calculateDistance(
        { lat: -34.0522, lng: -118.2437 },
        { lat: -34.0522, lng: -118.2437 }
      );
      expect(distance).toBe(0);
    });
  });

  describe('formatDistance', () => {
    it('should format distance less than 1km in meters', () => {
      expect(formatDistance(0.5)).toBe('500 m');
      expect(formatDistance(0.001)).toBe('1 m');
    });

    it('should format distance >= 1km with decimal precision', () => {
      expect(formatDistance(1.234)).toBe('1.2 km');
      expect(formatDistance(5.678)).toBe('5.7 km');
    });

    it('should round small distances properly', () => {
      expect(formatDistance(0.0005)).toBe('1 m'); // Rounds to 1m
      expect(formatDistance(0.0004)).toBe('0 m'); // Rounds to 0m
    });
  });

  describe('sortBoothsByDistance', () => {
    it('should sort booths by distance from location', () => {
      const booths = [
        mockBooth({ id: 'far', latitude: 34.0522, longitude: -118.2437 }), // LA
        mockBooth({ id: 'near', latitude: 37.7749, longitude: -122.4194 }), // SF
      ];

      const sorted = sortBoothsByDistance(booths, mockCoordinates.sf);

      expect(sorted[0].id).toBe('near');
      expect(sorted[1].id).toBe('far');
    });

    it('should handle booths with missing coordinates', () => {
      const booths = [
        mockBooth({ id: 'valid', latitude: 37.7749, longitude: -122.4194 }),
        mockBooth({ id: 'invalid', latitude: null, longitude: null }),
      ];

      const sorted = sortBoothsByDistance(booths, mockCoordinates.sf);

      // Valid coordinates should come first
      expect(sorted[0].id).toBe('valid');
      expect(sorted[1].id).toBe('invalid');
    });

    it('should add distance property to results', () => {
      const booths = [mockBooth({ latitude: 37.7749, longitude: -122.4194 })];
      const sorted = sortBoothsByDistance(booths, mockCoordinates.sf);

      expect(sorted[0].distance).toBeDefined();
      expect(typeof sorted[0].distance).toBe('number');
    });
  });

  describe('filterBoothsByRadius', () => {
    it('should filter booths within radius', () => {
      const booths = [
        mockBooth({ id: 'inside', latitude: 37.7749, longitude: -122.4194 }),
        mockBooth({ id: 'outside', latitude: 34.0522, longitude: -118.2437 }),
      ];

      // SF to LA is ~550km, so 200km radius should only include SF
      const filtered = filterBoothsByRadius(booths, mockCoordinates.sf, 200);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('inside');
    });

    it('should return empty array if no booths in radius', () => {
      const booths = [
        mockBooth({ latitude: 34.0522, longitude: -118.2437 }),
      ];

      const filtered = filterBoothsByRadius(booths, mockCoordinates.sf, 10);

      expect(filtered).toHaveLength(0);
    });

    it('should handle booths with missing coordinates', () => {
      const booths = [
        mockBooth({ latitude: null, longitude: null }),
        mockBooth({ latitude: 37.7749, longitude: -122.4194 }),
      ];

      const filtered = filterBoothsByRadius(booths, mockCoordinates.sf, 1000);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].latitude).toBe(37.7749);
    });

    it('should include booths at exact radius boundary', () => {
      const booths = [
        mockBooth({ latitude: 37.7749, longitude: -122.4194 }),
      ];

      const distance = calculateDistance(mockCoordinates.sf, {
        lat: 37.7749,
        lng: -122.4194,
      });

      const filtered = filterBoothsByRadius(
        booths,
        mockCoordinates.sf,
        distance
      );

      expect(filtered).toHaveLength(1);
    });
  });
});
```

### Test 2: Booth View Model

Create `/src/lib/boothViewModel.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { normalizeBooth } from '@/lib/boothViewModel';
import { mockBooth } from '@/tests/factories';

describe('boothViewModel', () => {
  describe('normalizeBooth', () => {
    it('should return null if data is null', () => {
      expect(normalizeBooth(null)).toBeNull();
    });

    it('should return null if required fields missing', () => {
      expect(normalizeBooth({ name: 'Test' })).toBeNull(); // Missing id, slug
      expect(normalizeBooth({ id: 'test' })).toBeNull(); // Missing slug, name
    });

    it('should normalize valid booth data', () => {
      const result = normalizeBooth(mockBooth());

      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result?.name).toBeDefined();
      expect(result?.locationLabel).toBeDefined();
    });

    it('should trim string values', () => {
      const result = normalizeBooth({
        id: '  booth-1  ',
        slug: '  booth-slug  ',
        name: '  Test Booth  ',
      });

      expect(result?.id).toBe('booth-1');
      expect(result?.slug).toBe('booth-slug');
      expect(result?.name).toBe('Test Booth');
    });

    it('should use fallback values for missing fields', () => {
      const result = normalizeBooth({
        id: 'test',
        slug: 'test-slug',
        name: 'Test',
        address: null,
        city: null,
      });

      expect(result?.address).toBe('Address not available');
      expect(result?.city).toBe('Location Unknown');
    });

    it('should validate and convert URL fields', () => {
      const result = normalizeBooth(
        mockBooth({
          photo_exterior_url: 'https://example.com/photo.jpg',
          photo_interior_url: 'not-a-url',
          website: 'https://booth.com',
        })
      );

      expect(result?.photo_exterior_url).toBe('https://example.com/photo.jpg');
      expect(result?.photo_interior_url).toBeUndefined(); // Invalid URL
      expect(result?.website).toBe('https://booth.com');
    });

    it('should reject URLs without http/https', () => {
      const result = normalizeBooth(
        mockBooth({
          photo_exterior_url: 'example.com/photo.jpg',
        })
      );

      expect(result?.photo_exterior_url).toBeUndefined();
    });

    it('should validate status against allowed values', () => {
      const validResult = normalizeBooth(mockBooth({ status: 'active' }));
      expect(validResult?.status).toBe('active');

      const invalidResult = normalizeBooth(mockBooth({ status: 'invalid' }));
      expect(invalidResult?.status).toBe('unverified'); // Default
    });

    it('should build location label correctly', () => {
      const result = normalizeBooth(
        mockBooth({
          city: 'San Francisco',
          country: 'USA',
          state: 'California',
        })
      );

      expect(result?.locationLabel).toBe('San Francisco, USA');
    });

    it('should build address display correctly', () => {
      const result = normalizeBooth(
        mockBooth({
          address: '123 Main St',
          postal_code: '94105',
          city: 'San Francisco',
          state: 'California',
          country: 'USA',
        })
      );

      expect(result?.addressDisplay).toContain('123 Main St');
      expect(result?.addressDisplay).toContain('94105');
      expect(result?.addressDisplay).toContain('San Francisco');
    });

    it('should detect valid location', () => {
      const validResult = normalizeBooth(
        mockBooth({ latitude: 37.7749, longitude: -122.4194 })
      );
      expect(validResult?.hasValidLocation).toBe(true);

      const invalidResult = normalizeBooth(
        mockBooth({ latitude: null, longitude: -122.4194 })
      );
      expect(invalidResult?.hasValidLocation).toBe(false);
    });

    it('should convert number strings to booleans', () => {
      const result = normalizeBooth(
        mockBooth({
          is_operational: 1 as any,
          accepts_cash: true,
        })
      );

      expect(result?.is_operational).toBe(false); // Not a boolean, so falsy
      expect(result?.accepts_cash).toBe(true);
    });

    it('should use current date for missing timestamps', () => {
      const now = new Date();
      const result = normalizeBooth(
        mockBooth({
          created_at: null,
          updated_at: null,
        })
      );

      const createdAt = new Date(result?.created_at || '');
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(now.getTime() - 1000);
    });
  });
});
```

### Test 3: Data Quality Scoring

Create `/src/lib/dataQuality.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateQualityScore,
  determineEnrichmentNeeds,
  calculateQualityStatistics,
  type BoothQualityData,
} from '@/lib/dataQuality';

const mockQualityBooth = (overrides?: Partial<BoothQualityData>): BoothQualityData => ({
  id: 'test-booth',
  name: 'Test Booth',
  city: 'San Francisco',
  country: 'USA',
  address: null,
  state: null,
  latitude: null,
  longitude: null,
  phone: null,
  website: null,
  hours: null,
  description: null,
  photo_exterior_url: null,
  ai_preview_url: null,
  photos: null,
  google_place_id: null,
  status: 'unverified',
  ...overrides,
});

describe('dataQuality', () => {
  describe('calculateQualityScore', () => {
    it('should return 0 for booth with no data', () => {
      const score = calculateQualityScore(mockQualityBooth());
      expect(score.score).toBe(0);
      expect(score.enrichmentPriority).toBe('critical');
    });

    it('should return 100 for booth with all fields', () => {
      const score = calculateQualityScore(
        mockQualityBooth({
          address: '123 Main St',
          state: 'CA',
          latitude: 37.7749,
          longitude: -122.4194,
          phone: '555-0123',
          website: 'https://example.com',
          hours: 'Mon-Fri 10am-6pm',
          description: 'A great booth',
          photo_exterior_url: 'https://example.com/photo.jpg',
          photos: ['https://example.com/1.jpg'],
          google_place_id: 'place-123',
          status: 'active',
        })
      );

      expect(score.score).toBe(100);
      expect(score.enrichmentPriority).toBe('complete');
    });

    it('should award points for each field', () => {
      const addressScore = calculateQualityScore(
        mockQualityBooth({ address: '123 Main St' })
      );
      expect(addressScore.score).toBe(10);

      const stateScore = calculateQualityScore(mockQualityBooth({ state: 'CA' }));
      expect(stateScore.score).toBe(5);

      const coordScore = calculateQualityScore(
        mockQualityBooth({ latitude: 37.7749, longitude: -122.4194 })
      );
      expect(coordScore.score).toBe(10);

      const imageScore = calculateQualityScore(
        mockQualityBooth({ photo_exterior_url: 'https://example.com/photo.jpg' })
      );
      expect(imageScore.score).toBe(15); // Image is worth 15 points
    });

    it('should require both lat/lng for coordinates points', () => {
      const noCoords = calculateQualityScore(
        mockQualityBooth({ latitude: 37.7749 }) // Missing longitude
      );
      expect(noCoords.score).toBe(0);

      const bothCoords = calculateQualityScore(
        mockQualityBooth({ latitude: 37.7749, longitude: -122.4194 })
      );
      expect(bothCoords.score).toBe(10);
    });

    it('should prioritize images (either exterior or AI)', () => {
      const exterior = calculateQualityScore(
        mockQualityBooth({ photo_exterior_url: 'https://example.com/photo.jpg' })
      );
      expect(exterior.score).toBe(15);

      const aiPreview = calculateQualityScore(
        mockQualityBooth({ ai_preview_url: 'https://example.com/ai.jpg' })
      );
      expect(aiPreview.score).toBe(15);

      const both = calculateQualityScore(
        mockQualityBooth({
          photo_exterior_url: 'https://example.com/photo.jpg',
          ai_preview_url: 'https://example.com/ai.jpg',
        })
      );
      expect(both.score).toBe(15); // Still 15, not 30
    });

    it('should list missing fields', () => {
      const score = calculateQualityScore(mockQualityBooth());
      expect(score.missingFields).toContain('address');
      expect(score.missingFields).toContain('phone');
      expect(score.missingFields).toContain('image');
      expect(score.missingFields.length).toBeGreaterThan(0);
    });

    it('should set enrichment priority based on score', () => {
      const critical = calculateQualityScore(mockQualityBooth()); // 0 score
      expect(critical.enrichmentPriority).toBe('critical');

      const high = calculateQualityScore(
        mockQualityBooth({ address: '123 Main St', phone: '555-0123' })
      ); // 20 score
      expect(high.enrichmentPriority).toBe('high');

      const medium = calculateQualityScore(
        mockQualityBooth({
          address: '123 Main St',
          phone: '555-0123',
          website: 'https://example.com',
        })
      ); // 30 score
      expect(medium.enrichmentPriority).toBe('high');

      const complete = calculateQualityScore(
        mockQualityBooth({
          address: '123 Main St',
          state: 'CA',
          latitude: 37.7749,
          longitude: -122.4194,
          phone: '555-0123',
          website: 'https://example.com',
          hours: 'Mon-Fri',
          description: 'Test',
          photo_exterior_url: 'https://example.com/photo.jpg',
          photos: ['https://example.com/1.jpg'],
          google_place_id: 'place-123',
          status: 'active',
        })
      ); // 100 score
      expect(complete.enrichmentPriority).toBe('complete');
    });
  });

  describe('determineEnrichmentNeeds', () => {
    it('should identify missing address', () => {
      const needs = determineEnrichmentNeeds(
        mockQualityBooth({ address: null })
      );
      expect(needs.missingFields.address).toBe(true);
      expect(needs.needsVenueData).toBe(true);
    });

    it('should identify missing image', () => {
      const needs = determineEnrichmentNeeds(
        mockQualityBooth({
          photo_exterior_url: null,
          ai_preview_url: null,
        })
      );
      expect(needs.missingFields.image).toBe(true);
      expect(needs.needsImage).toBe(true);
    });

    it('should identify missing coordinates', () => {
      const needs = determineEnrichmentNeeds(
        mockQualityBooth({ latitude: null, longitude: null })
      );
      expect(needs.missingFields.coordinates).toBe(true);
      expect(needs.needsGeocoding).toBe(true);
    });

    it('should show all complete when all data present', () => {
      const needs = determineEnrichmentNeeds(
        mockQualityBooth({
          address: '123 Main St',
          state: 'CA',
          latitude: 37.7749,
          longitude: -122.4194,
          phone: '555-0123',
          website: 'https://example.com',
          hours: 'Mon-Fri',
          photo_exterior_url: 'https://example.com/photo.jpg',
          google_place_id: 'place-123',
        })
      );

      expect(needs.needsVenueData).toBe(false);
      expect(needs.needsImage).toBe(false);
      expect(needs.needsGeocoding).toBe(false);
    });
  });

  describe('calculateQualityStatistics', () => {
    it('should calculate aggregate statistics', () => {
      const booths = [
        mockQualityBooth({ address: '123 Main' }), // 10 points
        mockQualityBooth({
          address: '456 Oak',
          phone: '555-0123',
          website: 'https://example.com',
        }), // 30 points
        mockQualityBooth({}), // 0 points
      ];

      const stats = calculateQualityStatistics(booths);

      expect(stats.total).toBe(3);
      expect(stats.complete).toBe(0); // None >= 80
      expect(stats.needsEnrichment).toBe(3); // All < 80
      expect(stats.critical).toBe(2); // 10 and 0 < 50
      expect(stats.averageScore).toBeCloseTo(13.33, 1);
    });

    it('should count missing fields accurately', () => {
      const booths = [
        mockQualityBooth({ address: null, phone: null }),
        mockQualityBooth({ address: null, phone: '555-0123' }),
      ];

      const stats = calculateQualityStatistics(booths);

      expect(stats.missingByField.address).toBe(2);
      expect(stats.missingByField.phone).toBe(1);
    });
  });
});
```

---

## Part 3: API Route Testing

### Example: Maps API Route

Create `/src/app/api/maps/city/[city]/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { GET } from './route';
import { mockBooth, mockBooths } from '@/tests/factories';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('/api/maps/city/[city]', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn(),
    };

    vi.mocked(createClient).mockReturnValue(mockSupabaseClient);
  });

  it('should return 404 if no booths found', async () => {
    mockSupabaseClient.order.mockResolvedValue({ data: [], error: null });

    const req = new Request('http://localhost:3000/api/maps/city/san-francisco');
    const response = await GET(req, {
      params: Promise.resolve({ city: 'san-francisco' }),
    });

    expect(response.status).toBe(404);
  });

  it('should return map URL for valid city', async () => {
    const booths = mockBooths(3);
    mockSupabaseClient.order.mockResolvedValue({ data: booths, error: null });

    const req = new Request('http://localhost:3000/api/maps/city/san-francisco');
    const response = await GET(req, {
      params: Promise.resolve({ city: 'san-francisco' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.mapUrl).toBeDefined();
    expect(data.boothCount).toBe(3);
  });

  it('should handle database errors', async () => {
    mockSupabaseClient.order.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const req = new Request('http://localhost:3000/api/maps/city/invalid');
    const response = await GET(req, {
      params: Promise.resolve({ city: 'invalid' }),
    });

    expect(response.status).toBe(500);
  });

  it('should convert slug to city name', async () => {
    const booths = mockBooths(1);
    mockSupabaseClient.order.mockResolvedValue({ data: booths, error: null });

    const req = new Request('http://localhost:3000/api/maps/city/san-francisco');
    const response = await GET(req, {
      params: Promise.resolve({ city: 'san-francisco' }),
    });

    const data = await response.json();
    expect(data.city).toBe('San Francisco');
  });
});
```

---

## Part 4: Component Testing

### Example: SearchBar Component

Create `/src/components/SearchBar.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

// Mock Next.js router (already in setup.ts)

describe('SearchBar', () => {
  it('should render search input', () => {
    render(<SearchBar />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('should display placeholder text', () => {
    render(<SearchBar placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('should update input value on change', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'San Francisco');

    expect(input).toHaveValue('San Francisco');
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SearchBar />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const input = screen.getByRole('searchbox');
    await user.click(input);

    // Results dropdown should appear
    await waitFor(() => {
      expect(screen.queryByRole('option')).not.toBeInTheDocument();
    });

    const outside = screen.getByTestId('outside');
    await user.click(outside);

    // Dropdown should close
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('should debounce search input', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole('searchbox');

    // Type quickly
    await user.type(input, 'San');

    // Should not search immediately (debounced)
    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    // Wait for debounce
    await waitFor(
      () => {
        expect(screen.queryByRole('option')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('should clear results when input is cleared', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    await user.type(input, 'Test');

    await waitFor(() => {
      expect(input.value).toBe('Test');
    });

    await user.clear(input);

    expect(input.value).toBe('');
  });
});
```

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run all tests including E2E
npm run test:all
```

### Expected Output

```
✓ distanceUtils (20 tests)
✓ boothViewModel (12 tests)
✓ dataQuality (18 tests)
✓ googleMapsUtils (8 tests)
...

Test Files  12 passed (12)
     Tests  120 passed (120)
```

---

## Next Steps

1. **Start Phase 1** by setting up tests/setup.ts and creating factories
2. **Run distance utils tests** to validate test setup
3. **Add tests incrementally**, starting with utilities
4. **Monitor coverage** with `npm run test:coverage`
5. **Integrate into CI/CD** pipeline

