#!/usr/bin/env npx tsx

/**
 * Analyze Places API usage patterns to identify cost reduction opportunities
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('📊 PLACES API USAGE ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  // 1. Check recent enrichments
  const { data: recentEnrichments } = await supabase
    .from('booths')
    .select('id, name, enriched_at, google_enriched_at')
    .not('enriched_at', 'is', null)
    .order('enriched_at', { ascending: false })
    .limit(20);

  console.log('🕒 Recent 20 enrichments:');
  recentEnrichments?.forEach(b => {
    const date = new Date(b.enriched_at);
    console.log(`  ${date.toLocaleDateString()} ${date.toLocaleTimeString()} - ${b.name}`);
  });

  // 2. Count enrichments by timeframe
  const { count: totalEnriched } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .not('enriched_at', 'is', null);

  const { count: enrichedLast7Days } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .gte('enriched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const { count: enrichedLast24Hours } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .gte('enriched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const { count: enrichedLast1Hour } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .gte('enriched_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

  console.log('\n📈 Enrichment statistics:');
  console.log(`  Total enriched booths: ${totalEnriched}`);
  console.log(`  Enriched in last 7 days: ${enrichedLast7Days}`);
  console.log(`  Enriched in last 24 hours: ${enrichedLast24Hours}`);
  console.log(`  Enriched in last 1 hour: ${enrichedLast1Hour}`);

  // 3. Calculate API costs
  const PLACES_TEXT_SEARCH_COST = 0.032; // $32 per 1000 requests
  const PLACES_DETAILS_COST = 0.017;     // $17 per 1000 requests
  const PLACES_PHOTO_COST = 0.007;       // $7 per 1000 requests
  const COST_PER_ENRICHMENT = PLACES_TEXT_SEARCH_COST + PLACES_DETAILS_COST + PLACES_PHOTO_COST;

  console.log('\n💰 Estimated Places API costs:');
  console.log(`  Cost per enrichment: $${COST_PER_ENRICHMENT.toFixed(4)}`);
  console.log(`    - Text Search: $${PLACES_TEXT_SEARCH_COST.toFixed(4)}`);
  console.log(`    - Place Details: $${PLACES_DETAILS_COST.toFixed(4)}`);
  console.log(`    - Photo: $${PLACES_PHOTO_COST.toFixed(4)}`);
  console.log();
  console.log(`  Total cost for ${totalEnriched} enrichments: $${(totalEnriched! * COST_PER_ENRICHMENT).toFixed(2)}`);
  console.log(`  Last 7 days: $${(enrichedLast7Days! * COST_PER_ENRICHMENT).toFixed(2)}`);
  console.log(`  Last 24 hours: $${(enrichedLast24Hours! * COST_PER_ENRICHMENT).toFixed(2)}`);
  console.log(`  Last 1 hour: $${(enrichedLast1Hour! * COST_PER_ENRICHMENT).toFixed(2)}`);

  // 4. Check for re-enrichments (booths enriched multiple times)
  const { data: potentialDuplicates } = await supabase
    .from('booths')
    .select('id, name, enriched_at, google_enriched_at, updated_at')
    .not('enriched_at', 'is', null)
    .not('google_enriched_at', 'is', null)
    .limit(100);

  let reEnrichmentCount = 0;
  potentialDuplicates?.forEach(b => {
    const enrichedDate = new Date(b.enriched_at).getTime();
    const googleDate = new Date(b.google_enriched_at).getTime();
    const diff = Math.abs(enrichedDate - googleDate);

    // If google_enriched_at and enriched_at differ by more than 1 hour, it's a re-enrichment
    if (diff > 60 * 60 * 1000) {
      reEnrichmentCount++;
    }
  });

  console.log('\n🔄 Re-enrichment analysis:');
  console.log(`  Checked ${potentialDuplicates?.length} enriched booths`);
  console.log(`  Found ${reEnrichmentCount} potential re-enrichments`);
  console.log(`  Re-enrichment rate: ${((reEnrichmentCount / (potentialDuplicates?.length || 1)) * 100).toFixed(1)}%`);

  if (reEnrichmentCount > 0) {
    console.log('\n  ⚠️  WARNING: Re-enrichments waste API calls and cost money!');
    console.log(`     Extra cost from re-enrichments: $${(reEnrichmentCount * COST_PER_ENRICHMENT).toFixed(2)}`);
  }

  // 5. Check crawl_sources to see how enrichments are triggered
  const { data: enabledSources } = await supabase
    .from('crawl_sources')
    .select('id, name, enabled, source_type')
    .eq('enabled', true);

  console.log('\n🎯 Enrichment triggers:');
  console.log(`  Enabled crawler sources: ${enabledSources?.length}`);
  console.log('  Each successful crawl triggers enrichment on new booths');

  // 6. Recommendations
  console.log('\n' + '='.repeat(80));
  console.log('💡 COST REDUCTION RECOMMENDATIONS');
  console.log('='.repeat(80));
  console.log();

  console.log('1. ✅ SKIP WINDOW (Already implemented):');
  console.log('   - Current: 7 days skip window');
  console.log('   - Prevents re-enrichment within 7 days');
  console.log('   - Consider increasing to 30 days');
  console.log();

  console.log('2. 🎯 CACHE PLACE IDs:');
  console.log('   - Store Place ID permanently after first lookup');
  console.log('   - Skip Text Search API ($0.032) on re-enrichments');
  console.log('   - Savings: ~57% per re-enrichment ($0.032 / $0.056)');
  console.log();

  console.log('3. 📉 REDUCE PLACE DETAILS FIELDS:');
  console.log('   - Current: fetching ALL fields');
  console.log('   - Needed: phone, website, hours, rating, photos');
  console.log('   - Use "fields" parameter to reduce cost');
  console.log('   - Savings: Up to 50% on Details API');
  console.log();

  console.log('4. 📸 PHOTO CACHING:');
  console.log('   - Photos rarely change');
  console.log('   - Download once, store permanently');
  console.log('   - Skip photo API ($0.007) on re-enrichments');
  console.log();

  console.log('5. 🚦 DAILY QUOTA:');
  console.log('   - Implement max enrichments per day');
  console.log('   - Prevents runaway costs');
  console.log('   - Recommended: 100-200 enrichments/day');
  console.log();

  console.log('6. 🔍 MANUAL TRIGGER:');
  console.log('   - Move from automatic to on-demand enrichment');
  console.log('   - Only enrich when user requests it');
  console.log('   - Savings: ~90% reduction in API calls');
  console.log();

  console.log('='.repeat(80));
}

main().catch(console.error);
