# Crawl Performance Breakdown Component Migration

## Summary

Successfully migrated the **Crawl Performance Breakdown** component from the old project (`booth-beacon`) to the new project (`booth-beacon-app`).

## Files Created

### Component: `/Users/jkw/Projects/booth-beacon-app/src/components/admin/CrawlPerformanceBreakdown.tsx`

**Features implemented:**
- Performance metrics from last 20 successful crawls
- Filter by source or "all sources" via dropdown selector
- Breakdown crawl time into phases:
  - **API Calls** (yellow) - Network requests to target sources
  - **AI Extraction** (blue) - OpenAI processing time
  - **Database Operations** (green) - Supabase insert/update time
  - **Other** (purple) - Deduplication, validation, and misc overhead

- **Visual representations:**
  - Stacked progress bars for each phase with percentage and duration
  - Color-coded bars matching phase themes
  - Smooth transitions on data updates

- **Efficiency metrics:**
  - Average time per page crawled
  - Average time per booth extracted
  - Booths per page ratio (yield metric)
  - Total pages and booths processed
  - Sample size indicator

- **Recent crawls section:**
  - Scrollable list of last 10 crawls
  - Shows source name, pages/booths count, duration, and date
  - Compact card layout

- **Performance insights panel:**
  - Automatic bottleneck detection with color-coded alerts:
    - **High API time** (>50%): Suggests caching or batching
    - **High extraction time** (>40%): Notes this is expected for AI crawls
    - **Low booth yield** (<2 per page): Suggests targeting denser sources
    - **Database bottleneck** (>30%): Suggests query optimization or bulk inserts
    - **Optimal performance**: Shows when all metrics are healthy

## Integration

### Modified: `/Users/jkw/Projects/booth-beacon-app/src/app/admin/page.tsx`

**Changes made:**
1. Added import for `CrawlPerformanceBreakdown` component
2. Added new "Performance" tab trigger with Zap icon
3. Added `<TabsContent value="performance">` section with the component

**Tab order:**
- Metrics Dashboard
- Photo Moderation
- Data Crawler
- User Management
- Analytics
- Crawler Logs
- Crawler Health
- **Performance** (new)
- Job Queue

## Adaptations for Next.js

The component was adapted from the old React project with the following changes:

1. **'use client' directive** - Added at top for Next.js client component
2. **Supabase import** - Changed from `@/integrations/supabase/client` to `@/lib/supabase/client`
3. **Styling** - Updated to match the new project's dark theme:
   - Background: `bg-neutral-800` for cards
   - Borders: `border-neutral-700`
   - Text: `text-white` for primary, `text-neutral-400` for secondary
   - Muted backgrounds: `bg-neutral-900` for nested elements
4. **Toast notifications** - Uses `sonner` (already configured in project)
5. **UI components** - Uses project's existing shadcn/ui components

## Database Requirements

The component queries the `crawler_metrics` table with the following fields:
- `source_name` - Name of the crawl source
- `status` - Must be 'success' for inclusion
- `duration_ms` - Total crawl duration
- `api_call_duration_ms` - Time spent on API calls
- `extraction_duration_ms` - Time spent on AI extraction
- `pages_crawled` - Number of pages processed
- `booths_extracted` - Number of booths found
- `completed_at` - Timestamp of completion

## Usage

1. Navigate to Admin Dashboard (`/admin`)
2. Click the "Performance" tab (lightning bolt icon)
3. View overall performance breakdown and insights
4. Use dropdown to filter by specific source or view all sources
5. Review efficiency metrics and recent crawl history
6. Check insights panel for optimization recommendations

## Testing Checklist

- [x] Component compiles without errors
- [x] Build succeeds (`npm run build`)
- [x] Component properly integrated into admin page
- [x] All imports resolve correctly
- [x] Styling matches project design system
- [x] Empty state handled gracefully (no data available)
- [x] Loading state displays spinner
- [x] Source filter dropdown functional
- [x] Performance insights show appropriate thresholds

## Performance Insights Thresholds

The component automatically analyzes metrics and provides insights based on these thresholds:

- **API Calls > 50%**: Warning about high network time
- **AI Extraction > 40%**: Note that this is expected but could be optimized
- **Booths per Page < 2**: Low yield warning
- **Database Operations > 30%**: Database bottleneck warning
- **All metrics healthy**: Congratulatory message

## Future Enhancements

Potential improvements for future iterations:

1. **Historical trends**: Show performance over time (7-day, 30-day charts)
2. **Comparison mode**: Compare performance between sources side-by-side
3. **Export data**: Download performance metrics as CSV/JSON
4. **Alert configuration**: Allow admins to set custom thresholds
5. **Real-time updates**: Auto-refresh when new crawls complete
6. **Drill-down views**: Click a metric to see detailed breakdown
7. **Cost analysis**: Show OpenAI API costs per crawl
8. **Optimization suggestions**: AI-powered recommendations based on patterns

## Notes

- Component designed to handle up to 20 recent crawls efficiently
- Calculations performed client-side for responsive interaction
- No server-side API needed - queries Supabase directly
- Safe to use with empty database (shows appropriate empty state)
- Responsive design works on mobile, tablet, and desktop
- All text and UI elements follow accessibility best practices
