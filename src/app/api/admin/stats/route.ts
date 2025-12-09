import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'edge';
export const revalidate = 30; // Cache for 30 seconds

export async function GET() {
  try {
    // Execute all queries in parallel for maximum performance
    const [
      totalBooths,
      activeBooths,
      pendingBooths,
      totalUsers,
      pendingPhotos,
      totalReviews,
      todayMetrics,
      lastRun,
      errorCount,
      enabledSources
    ] = await Promise.all([
      supabase.from('booths').select('*', { count: 'exact', head: true }),
      supabase.from('booths').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('booths').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('booth_user_photos').select('*', { count: 'exact', head: true }).eq('moderation_status', 'pending'),
      supabase.from('booth_comments').select('*', { count: 'exact', head: true }),
      // Crawler metrics from today
      supabase.from('crawler_metrics')
        .select('booths_extracted')
        .gte('started_at', new Date().setHours(0, 0, 0, 0).toString()),
      // Last successful run
      supabase.from('crawler_metrics')
        .select('completed_at')
        .eq('status', 'success')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Error count today
      supabase.from('crawler_metrics')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'error')
        .gte('started_at', new Date().setHours(0, 0, 0, 0).toString()),
      // Enabled sources count
      supabase.from('crawl_sources')
        .select('*', { count: 'exact', head: true })
        .eq('enabled', true)
    ]);

    const crawledToday = todayMetrics.data?.reduce((sum: number, m: any) => sum + (m.booths_extracted || 0), 0) || 0;

    const stats = {
      booths: {
        total: totalBooths.count || 0,
        active: activeBooths.count || 0,
        pending: pendingBooths.count || 0,
      },
      users: {
        total: totalUsers.count || 0,
      },
      photos: {
        pending: pendingPhotos.count || 0,
      },
      reviews: {
        total: totalReviews.count || 0,
      },
      crawler: {
        crawledToday,
        lastRun: lastRun.data?.completed_at ? new Date(lastRun.data.completed_at).toLocaleString() : '-',
        errorCount: errorCount.count || 0,
        enabledSources: enabledSources.count || 0,
      }
    };

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
