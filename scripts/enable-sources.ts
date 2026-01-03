#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const sourcesToEnable = [
    'lomography.com',
    'photomatica.com',
    'photoautomat.de'
  ];

  console.log('Enabling sources...\n');

  for (const source of sourcesToEnable) {
    const { data, error } = await supabase
      .from('crawl_sources')
      .update({ enabled: true })
      .eq('source_name', source)
      .select();

    if (error) {
      console.log(`❌ ${source}: ${error.message}`);
    } else {
      console.log(`✅ ${source}: Enabled`);
    }
  }

  console.log('\nVerifying all 5 target sources are now enabled...\n');

  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('source_name, enabled, priority')
    .in('source_name', [
      'photobooth.net',
      'lomography.com',
      'photomatica.com',
      'autophoto.org',
      'photoautomat.de'
    ])
    .order('priority', { ascending: false });

  sources?.forEach(s => {
    const status = s.enabled ? '✅' : '❌';
    console.log(`${status} ${s.source_name} (priority: ${s.priority}, enabled: ${s.enabled})`);
  });
}

main();
