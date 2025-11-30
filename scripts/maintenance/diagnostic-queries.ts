import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runDiagnostics() {
  console.log('🔍 Running Diagnostic Queries...\n');

  // Query 1: Check raw content storage
  console.log('📊 Query 1: Raw Content Storage');
  console.log('=' .repeat(60));
  try {
    const { data: rawContent, error } = await supabase
      .from('raw_content_storage')
      .select('source_id, content')
      .limit(1000);

    if (error) {
      console.log('Error:', error.message);
    } else if (rawContent) {
      // Group by source_id
      const grouped = rawContent.reduce((acc: Record<string, { count: number; totalLength: number }>, row: { source_id: string; content: string | null }) => {
        if (!acc[row.source_id]) {
          acc[row.source_id] = { count: 0, totalLength: 0 };
        }
        acc[row.source_id].count++;
        acc[row.source_id].totalLength += (row.content || '').length;
        return acc;
      }, {});

      console.log(`Total pages crawled: ${rawContent.length}`);
      console.log('\nBreakdown by source:');
      Object.entries(grouped).forEach(([sourceId, stats]: [string, { count: number; totalLength: number }]) => {
        console.log(`  Source ${sourceId}: ${stats.count} pages, avg ${Math.round(stats.totalLength / stats.count)} chars`);
      });
    }
  } catch (err) {
    console.log('Query failed:', err);
  }

  console.log('\n');

  // Query 2: Check crawler metrics
  console.log('📊 Query 2: Crawler Metrics (Last 30 Days)');
  console.log('=' .repeat(60));
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: metrics, error } = await supabase
      .from('crawler_metrics')
      .select('source_name, status, pages_crawled, booths_extracted, completed_at')
      .gte('completed_at', thirtyDaysAgo.toISOString())
      .order('completed_at', { ascending: false });

    if (error) {
      console.log('Error:', error.message);
    } else if (metrics) {
      console.log(`Total crawl runs: ${metrics.length}`);

      // Group by source and status
      interface GroupedMetric {
        source_name: string;
        status: string;
        count: number;
        total_pages: number;
        total_booths: number;
      }
      const grouped = metrics.reduce((acc: Record<string, GroupedMetric>, row: { source_name?: string | null; status?: string | null; pages_crawled?: number | null; booths_extracted?: number | null }) => {
        const key = `${row.source_name || 'unknown'}_${row.status || 'unknown'}`;
        if (!acc[key]) {
          acc[key] = {
            source_name: row.source_name || 'unknown',
            status: row.status || 'unknown',
            count: 0,
            total_pages: 0,
            total_booths: 0,
          };
        }
        acc[key].count++;
        acc[key].total_pages += row.pages_crawled || 0;
        acc[key].total_booths += row.booths_extracted || 0;
        return acc;
      }, {});

      console.log('\nBreakdown by source and status:');
      Object.values(grouped)
        .sort((a: GroupedMetric, b: GroupedMetric) => b.total_booths - a.total_booths)
        .forEach((stat: GroupedMetric) => {
          console.log(`  ${stat.source_name} (${stat.status}): ${stat.count} runs, ${stat.total_pages} pages, ${stat.total_booths} booths`);
        });
    }
  } catch (err) {
    console.log('Query failed:', err);
  }

  console.log('\n');

  // Query 3: Check booths table
  console.log('📊 Query 3: Current Booth Inventory');
  console.log('=' .repeat(60));
  try {
    const { data: booths, error } = await supabase
      .from('booths')
      .select('id, name, city, country, status');

    if (error) {
      console.log('Error:', error.message);
    } else if (booths) {
      console.log(`Total booths: ${booths.length}`);

      const cities = new Set(booths.map(b => b.city).filter(Boolean));
      const countries = new Set(booths.map(b => b.country).filter(Boolean));

      console.log(`Unique cities: ${cities.size}`);
      console.log(`Unique countries: ${countries.size}`);

      console.log('\nBooth details:');
      booths.forEach(booth => {
        console.log(`  - ${booth.name || 'Unnamed'} in ${booth.city || 'Unknown'}, ${booth.country || 'Unknown'} (${booth.status || 'unknown'})`);
      });
    }
  } catch (err) {
    console.log('Query failed:', err);
  }

  console.log('\n');

  // Query 4: Check crawl sources
  console.log('📊 Query 4: Crawl Sources Configuration');
  console.log('=' .repeat(60));
  try {
    const { data: sources, error } = await supabase
      .from('crawl_sources')
      .select('id, name, enabled, priority, extractor_type')
      .order('priority', { ascending: false });

    if (error) {
      console.log('Error:', error.message);
    } else if (sources) {
      console.log(`Total configured sources: ${sources.length}`);
      console.log(`Enabled sources: ${sources.filter(s => s.enabled).length}`);

      console.log('\nTop 10 sources by priority:');
      sources.slice(0, 10).forEach(source => {
        console.log(`  ${source.enabled ? '✅' : '❌'} ${source.name} (priority: ${source.priority}, extractor: ${source.extractor_type})`);
      });
    }
  } catch (err) {
    console.log('Query failed:', err);
  }

  console.log('\n');
  console.log('✅ Diagnostic queries complete!');
}

runDiagnostics().catch(console.error);
