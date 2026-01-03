import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function setupStorageBucket() {
  console.log('🔧 Setting up booth-photos storage bucket for Phase 3...\n');

  try {
    // Create the bucket using the storage API
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const existingBucket = buckets?.find(b => b.id === 'booth-photos');

    if (existingBucket) {
      console.log('✓ Bucket "booth-photos" already exists');
    } else {
      console.log('Creating bucket "booth-photos"...');
      const { data, error } = await supabase.storage.createBucket('booth-photos', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
      });

      if (error) {
        console.error('❌ Error creating bucket:', error);
        return;
      }
      console.log('✅ Bucket created successfully');
    }

    console.log('\n📝 Manual steps required:');
    console.log('\n1. Go to Supabase Dashboard → Storage → Policies');
    console.log('2. Add the following RLS policies for the booth-photos bucket:\n');
    console.log('Policy 1: "Authenticated users can upload booth photos"');
    console.log('   Operation: INSERT');
    console.log('   Target roles: authenticated');
    console.log('   Policy definition: bucket_id = \'booth-photos\' AND (storage.foldername(name))[1] = auth.uid()::text\n');

    console.log('Policy 2: "Public can view approved booth photos"');
    console.log('   Operation: SELECT');
    console.log('   Target roles: public');
    console.log('   Policy definition: bucket_id = \'booth-photos\'\n');

    console.log('Policy 3: "Users can update their own photos"');
    console.log('   Operation: UPDATE');
    console.log('   Target roles: authenticated');
    console.log('   Policy definition: bucket_id = \'booth-photos\' AND (storage.foldername(name))[1] = auth.uid()::text\n');

    console.log('Policy 4: "Users can delete their own photos"');
    console.log('   Operation: DELETE');
    console.log('   Target roles: authenticated');
    console.log('   Policy definition: bucket_id = \'booth-photos\' AND (storage.foldername(name))[1] = auth.uid()::text\n');

    console.log('\nAlternatively, run this SQL in the Supabase SQL Editor:\n');
    console.log(`
-- RLS Policy: Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload booth photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'booth-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Anyone can view approved photos
CREATE POLICY "Public can view approved booth photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'booth-photos');

-- RLS Policy: Users can update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'booth-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'booth-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'booth-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
    `);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupStorageBucket();
