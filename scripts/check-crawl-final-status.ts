#!/usr/bin/env tsx

/**
 * Check final status of the crawl and database
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('📊 Checking final crawler status...\n');

  // Wait a bit more for autophoto.org
  console.log('⏳ Waiting 3 minutes for autophoto.org to complete...\n');
  await new Promise(resolve => setTimeout(resolve, 180000));

  // Check output file
  const outputFile = '/tmp/claude/-Users-jkw/tasks/b0c28d7.output';
  const content = fs.readFileSync(outputFile, 'utf-8');

  console.log('═'.repeat(60));
  console.log('CRAWLER OUTPUT');
  console.log('═'.repeat(60));
  console.log(content);
  console.log('\n');

  // Check database
  const { count } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📈 Total booths in database: ${count}\n`);

  // Check crawl_sources timestamps
  console.log('Last crawl timestamps for target sources:\n');
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('source_name, last_crawl_timestamp')
    .in('source_name', [
      'lomography.com',
      'photoautomat.de',
      'photomatica.com',
      'autophoto.org',
      'photobooth.net'
    ])
    .order('last_crawl_timestamp', { ascending: false });

  sources?.forEach(s => {
    const time = s.last_crawl_timestamp
      ? new Date(s.last_crawl_timestamp).toLocaleString()
      : 'Never';
    console.log(`  ${s.source_name}: ${time}`);
  });

  console.log('\n✅ Status check complete!\n');
}

main();
