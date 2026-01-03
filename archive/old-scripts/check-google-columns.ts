import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk'
);

async function checkColumns() {
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    const googleCols = Object.keys(data[0]).filter(k => k.includes('google')).sort();
    console.log('Google-related columns:');
    console.log(googleCols.length > 0 ? googleCols.join(', ') : 'None found');
    
    console.log('\nAll columns:');
    console.log(Object.keys(data[0]).sort().join('\n'));
  }
}

checkColumns();
