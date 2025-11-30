# Component Comparison: Old vs New

## File Sizes
- **Old Component**: 416 lines (booth-beacon)
- **New Component**: 437 lines (booth-beacon-app)
- **Difference**: +21 lines (+5%)

## Key Changes

### Imports
**Old:**
```typescript
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
```

**New:**
```typescript
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
```

### Directives
**New component includes:**
```typescript
'use client';
```

### Styling Theme
**Old:** Generic muted theme with default shadcn colors
**New:** Dark theme optimized styling:
- `bg-neutral-800` and `bg-neutral-900` backgrounds
- `border-neutral-700` borders
- `text-white` and `text-neutral-400` text colors
- Enhanced contrast for dark backgrounds

### Toast System
**Old:** Used generic toast library
**New:** Uses `sonner` toast library (already in project)

## Feature Parity

All features from the old component are preserved:

✅ **Performance Metrics**
- 20 most recent successful crawls
- Source filtering dropdown
- Real-time calculations

✅ **Phase Breakdown**
- API Calls (yellow, 40-60% typical)
- AI Extraction (blue, 30-50% typical)
- Database Operations (green, 5-20% typical)
- Other/Dedup/Validation (purple, remaining)

✅ **Visual Elements**
- Progress bars with percentages
- Duration displays (ms to seconds/minutes)
- Color-coded phase indicators
- Smooth transitions

✅ **Efficiency Metrics**
- Average time per page
- Average time per booth
- Booths per page ratio
- Total counts and sample size

✅ **Recent Crawls**
- Last 10 crawls displayed
- Scrollable list
- Source, pages, booths, duration, date shown

✅ **Performance Insights**
- Automatic bottleneck detection
- Color-coded alert boxes
- Actionable recommendations
- Threshold-based warnings

## Integration Points

### Admin Page
The component is integrated as a new tab in the admin dashboard:

```typescript
// Import
import { CrawlPerformanceBreakdown } from '@/components/admin/CrawlPerformanceBreakdown';

// Tab Trigger
<TabsTrigger value="performance">
  <Zap className="w-4 h-4 mr-2" />
  Performance
</TabsTrigger>

// Tab Content
<TabsContent value="performance" className="mt-6">
  <CrawlPerformanceBreakdown />
</TabsContent>
```

## Database Schema
Both versions use the same database schema from `crawler_metrics` table:
- `source_name` (text)
- `status` (text, filtered to 'success')
- `duration_ms` (integer)
- `api_call_duration_ms` (integer)
- `extraction_duration_ms` (integer)
- `pages_crawled` (integer)
- `booths_extracted` (integer)
- `completed_at` (timestamp)

## Calculated Fields
The component calculates `database_duration_ms` client-side:
```typescript
database_duration_ms = total_duration_ms - api_call_duration_ms - extraction_duration_ms
```

## Testing
✅ Build successful
✅ No TypeScript errors
✅ No ESLint warnings
✅ Component renders without errors
✅ All imports resolve correctly
✅ Styling matches project theme

## Migration Notes
The migration was straightforward with minimal changes needed:
1. Updated import paths for new project structure
2. Added 'use client' directive for Next.js
3. Adjusted styling for dark theme
4. Maintained all functionality and features
5. No breaking changes to component API
