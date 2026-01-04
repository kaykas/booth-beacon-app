import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk'
);

// First, let's get some Berlin booth IDs
const { data: berlinBooths, error: boothError } = await supabase
  .from('booths')
  .select('id')
  .eq('city', 'Berlin')
  .eq('status', 'active')
  .limit(5);

if (boothError) {
  console.error('Error fetching Berlin booths:', boothError);
  process.exit(1);
}

const boothIds = berlinBooths.map(b => b.id);

console.log(`Found ${boothIds.length} Berlin booths:`, boothIds);

// Create a sample Berlin guide
const { data, error } = await supabase
  .from('city_guides')
  .insert([
    {
      slug: 'berlin',
      city: 'Berlin',
      country: 'Germany',
      title: 'Photo Booths in Berlin: A Walking Tour',
      description: 'Discover the best analog photo booths in Berlin, from train stations to hidden neighborhood gems. This curated route takes you through Kreuzberg, Friedrichshain, and beyond.',
      hero_image_url: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?q=80&w=1200&auto=format&fit=crop',
      estimated_time: '2-3 hours',
      booth_ids: boothIds,
      published: true,
      tips: 'Start early in the morning for best light. Bring €2 coins for each booth. Most booths are busiest on weekends.',
    }
  ])
  .select();

if (error) {
  console.error('Error creating guide:', error);
  process.exit(1);
}

console.log('✅ Sample Berlin guide created successfully!');
console.log(JSON.stringify(data, null, 2));
