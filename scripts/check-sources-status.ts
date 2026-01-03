#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TARGET_SOURCES = [
  'photobooth.net',
  'lomography.com',
  'photomatica.com',
  'autophoto.org',
  'photoautomat.de'
];

async function main() {
  console.log('Checking crawler_metrics table schema...\n');

  // Get crawler_metrics schema
  const { data: metricsData, error: metricsError } = await supabase
    .from('crawler_metrics')
    .select('*')
    .limit(1);

  if (metricsError) {
    console.log('❌ Error accessing crawler_metrics:', metricsError.message);
  } else {
    console.log('✅ crawler_metrics columns:', Object.keys(metricsData[0] || {}));
  }

  console.log('\nChecking target sources...\n');

  // Check all sources
  const { data: allSources, error: allError } = await supabase
    .from('crawl_sources')
    .select('source_name, enabled, priority')
    .order('source_name');

  if (allError) {
    console.error('❌ Error querying sources:', allError.message);
    return;
  }

  console.log(`Found ${allSources.length} total sources in database\n`);

  // Check target sources
  TARGET_SOURCES.forEach(target => {
    const found = allSources.find(s => s.source_name === target);
    if (found) {
      console.log(`✅ ${target}`);
      console.log(`   Enabled: ${found.enabled}`);
      console.log(`   Priority: ${found.priority}`);
    } else {
      console.log(`❌ ${target} - NOT FOUND IN DATABASE`);
    }
  });

  console.log('\nAll sources in database:');
  allSources.forEach(s => {
    console.log(`  - ${s.source_name} (priority: ${s.priority}, enabled: ${s.enabled})`);
  });
}

main();
