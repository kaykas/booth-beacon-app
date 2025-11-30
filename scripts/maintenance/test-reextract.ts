/**
 * Test reextraction Edge Function
 */

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTExOTksImV4cCI6MjA3OTc2NzE5OX0.RWaExXyJa5MBX0hWQ4i_YHkqjmN0IbJYvImN3-VVtUQ';

async function testReextract() {
  console.log('\n🧪 Testing reextract-content Edge Function...\n');

  const endpoint = `${SUPABASE_URL}/functions/v1/reextract-content/batch`;

  console.log(`Endpoint: ${endpoint}`);
  console.log(`Using ANON key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

  try {
    console.log('\n📤 Sending POST request...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit: 1 }),
    });

    console.log(`\n📥 Response status: ${response.status} ${response.statusText}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log(`\n📄 Response body:`);
    console.log(text);

    if (!response.ok) {
      console.error('\n❌ Request failed!');
    } else {
      console.log('\n✅ Request successful!');
    }
  } catch (error) {
    console.error('\n❌ Error calling function:', error);
  }
}

testReextract();
