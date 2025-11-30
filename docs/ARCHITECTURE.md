# Booth Beacon Architecture

## Robust Error Handling & Recovery

This document outlines the architectural improvements made to ensure booth pages are resilient and provide a great user experience even when errors occur.

### Problem Statement

Previously, booth pages would fail with generic server errors when:
- Supabase environment variables were not configured
- Database queries failed
- Network issues occurred
- Invalid slugs were accessed

### Solution: Multi-Layer Error Handling

#### 1. Environment Variable Validation

**File**: `src/lib/supabase/client.ts`

- Validates Supabase configuration on module load
- Provides clear error messages when configuration is missing
- Throws descriptive errors that trigger error boundaries
- Prevents silent failures

```typescript
// Validates config and throws clear errors
export function createServerClient() {
  if (!url || url === 'https://placeholder.supabase.co') {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  // ...
}
```

#### 2. Error Boundaries

**Files**:
- `src/app/booth/[slug]/error.tsx` - Catches runtime errors
- `src/app/booth/[slug]/not-found.tsx` - Handles 404s gracefully
- `src/app/booth/[slug]/loading.tsx` - Shows loading state

**Benefits**:
- User sees friendly error message instead of blank page
- Provides action buttons (Try Again, Browse Map, Go Home)
- Shows error details in development mode
- Logs errors for debugging

#### 3. Database Query Error Handling

**File**: `src/app/booth/[slug]/page.tsx`

All database queries now:
- Wrap calls in try/catch blocks
- Log specific error messages
- Return null or empty arrays on failure (graceful degradation)
- Re-throw configuration errors to trigger error boundaries

```typescript
async function getBooth(slug: string): Promise<Booth | null> {
  try {
    const supabase = createServerClient();
    // ... query logic
  } catch (error) {
    console.error(`Error in getBooth for slug "${slug}":`, error);
    if (error instanceof Error && error.message.includes('not configured')) {
      throw error; // Trigger error boundary
    }
    return null; // Graceful fallback
  }
}
```

#### 4. Incremental Static Regeneration (ISR)

```typescript
export const revalidate = 300; // Revalidate every 5 minutes
```

**Benefits**:
- Pages are pre-rendered and cached
- Reduces database load
- Improves performance
- Provides fallback content if database is temporarily unavailable

### Error Recovery Flow

```
User visits /booth/some-slug
          |
          v
    Loading State
          |
          v
    Try to fetch booth data
          |
          +---> Success: Render booth page
          |
          +---> Not Found: Show 404 page with actions
          |
          +---> Database Error: Log & return null → Show 404
          |
          +---> Config Error: Throw error → Error Boundary
                                               |
                                               v
                                    Show error page with:
                                    - Friendly message
                                    - Try Again button
                                    - Browse Map button
                                    - Go Home button
```

### Testing Error Scenarios

#### Test 1: Missing Environment Variables

```bash
# Temporarily remove from .env.local
# NEXT_PUBLIC_SUPABASE_URL=...
npm run build
# Should see clear error message
```

#### Test 2: Invalid Slug (404)

```
Visit: http://localhost:3000/booth/does-not-exist
Expected: Custom 404 page with actions
```

#### Test 3: Database Error

```typescript
// Temporarily break query in getBooth()
// Should log error and show 404
```

### Monitoring & Logging

All errors are logged with context:

```typescript
console.error(`Failed to fetch booth "${slug}":`, error.message);
console.error('Error in getNearbyBooths:', error);
```

**In production**, these logs appear in:
- Vercel Function Logs
- Browser console (client-side errors)
- Error tracking services (if configured)

### Future Improvements

1. **Error Tracking Service**
   - Integrate Sentry or similar
   - Capture error rate metrics
   - Alert on configuration issues

2. **Graceful Degradation**
   - Show cached/stale content when DB unavailable
   - Implement retry logic with exponential backoff

3. **Health Checks**
   - Add /api/health endpoint
   - Verify Supabase connectivity
   - Monitor from external service

4. **Feature Flags**
   - Disable features gracefully if services unavailable
   - Show maintenance mode

### Deployment Checklist

Before deploying to production:

- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` is set in Vercel
- [ ] Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in Vercel
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- [ ] Test error pages in preview deployment
- [ ] Check Vercel Function Logs for configuration errors
- [ ] Test 404 handling with invalid slug
- [ ] Verify ISR is working (check cache headers)

### Key Files

- `src/lib/supabase/client.ts` - Supabase configuration & validation
- `src/app/booth/[slug]/page.tsx` - Main booth page with error handling
- `src/app/booth/[slug]/error.tsx` - Error boundary
- `src/app/booth/[slug]/not-found.tsx` - 404 page
- `src/app/booth/[slug]/loading.tsx` - Loading state

### Related Routes

The same error handling pattern should be applied to:
- `/guides/[city]/page.tsx`
- `/operators/[slug]/page.tsx`
- `/machines/[model]/page.tsx`

## Questions?

If you encounter issues:

1. Check Vercel Function Logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test locally with `npm run dev`
4. Check browser console for client-side errors
5. Review this document for error recovery flow
