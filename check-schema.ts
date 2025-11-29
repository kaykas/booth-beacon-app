import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  console.log('🔍 Checking Database Schema...\n');

  // Check what tables exist
  console.log('📊 Checking crawler_metrics columns');
  console.log('=' .repeat(60));
  try {
    const { data, error } = await supabase
      .from('crawler_metrics')
      .select('*')
      .limit(5);

    if (error) {
      console.log('Error:', error.message);
    } else if (data && data.length > 0) {
      console.log('Sample record columns:', Object.keys(data[0]));
      console.log('\nSample records:');
      data.forEach((record, i) => {
        console.log(`\nRecord ${i + 1}:`);
        console.log(JSON.stringify(record, null, 2));
      });
    } else {
      console.log('No records found in crawler_metrics');
    }
  } catch (err) {
    console.log('Query failed:', err);
  }

  console.log('\n');

  // Check crawl_sources
  console.log('📊 Checking crawl_sources details');
  console.log('=' .repeat(60));
  try {
    const { data, error } = await supabase
      .from('crawl_sources')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: false })
      .limit(5);

    if (error) {
      console.log('Error:', error.message);
    } else if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
      console.log('\nTop 5 enabled sources:');
      data.forEach(source => {
        console.log(`\n  Name: ${source.name}`);
        console.log(`  URL: ${source.source_url || source.url}`);
        console.log(`  Extractor: ${source.extractor_type}`);
        console.log(`  Priority: ${source.priority}`);
        console.log(`  Last crawled: ${source.last_crawled_at || 'Never'}`);
      });
    }
  } catch (err) {
    console.log('Query failed:', err);
  }

  console.log('\n');

  // Check if crawl_job_queue exists
  console.log('📊 Checking crawl_job_queue');
  console.log('=' .repeat(60));
  try {
    const { data, error } = await supabase
      .from('crawl_job_queue')
      .select('*')
      .limit(10);

    if (error) {
      console.log('Error:', error.message);
    } else {
      console.log(`Found ${data?.length || 0} jobs in queue`);
      if (data && data.length > 0) {
        console.log('\nJobs:');
        data.forEach(job => {
          console.log(`  - ${job.source_name}: ${job.status} (priority: ${job.priority})`);
        });
      }
    }
  } catch (err) {
    console.log('Queue table may not exist or has different schema');
  }

  console.log('\n✅ Schema check complete!');
}

checkSchema().catch(console.error);
