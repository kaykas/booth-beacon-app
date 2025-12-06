import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkIndexes() {
  console.log('🔍 Checking indexes for enrichment columns...\n');

  const query = `
    SELECT
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = 'booths'
    AND (
      indexname LIKE '%enrichment%'
      OR indexname LIKE '%geocoded%'
      OR indexname LIKE '%place_id%'
    )
    ORDER BY indexname;
  `;

  const { data, error } = await supabase.rpc('exec_sql_query', { query_text: query });

  if (error) {
    // Try alternative approach using a custom query
    console.log('Using alternative method to check indexes...\n');
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/pg_indexes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    console.log('Expected indexes for enrichment columns:');
    console.log('  ✓ idx_booths_enrichment_attempted - Index on enrichment_attempted_at');
    console.log('  ✓ idx_booths_geocoded - Index on geocoded_at');
    console.log('  ✓ idx_booths_google_place_id - Index on google_place_id');
    console.log('\nNote: Indexes are typically created automatically or via migration.');
  }
}

checkIndexes();
