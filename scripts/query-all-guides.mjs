import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTExOTksImV4cCI6MjA3OTc2NzE5OX0.nVAPKx30OTNSaZ92Koeg_gUonm3Zols3FOTvfO5TrrA'
);

const { data, error } = await supabase
  .from('city_guides')
  .select('id, slug, city, country, title, hero_image_url, estimated_time, booth_ids, published')
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error:', error);
} else {
  console.log(JSON.stringify(data, null, 2));
}
