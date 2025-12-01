import { createClient } from '@supabase/supabase-js';

async function triggerPhotoboothCrawler() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('\n🚀 TRIGGERING PHOTOBOOTH.NET CRAWLER\n');

  // Call the unified-crawler Edge Function for photobooth.net sources
  const response = await fetch(
    'https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/unified-crawler',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_filter: 'photobooth.net', // Filter to only photobooth.net sources
        batch_size: 1,
      }),
    }
  );

  console.log('📡 Crawler triggered!');
  console.log('Status:', response.status, response.statusText);

  if (response.ok) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      console.log('\n📊 Streaming crawler output:\n');

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                console.log(JSON.stringify(data, null, 2));
              } catch (e) {
                console.log(line);
              }
            }
          }
        }
      } catch (e) {
        console.error('Stream error:', e);
      }
    }
  } else {
    const text = await response.text();
    console.error('❌ Crawler failed:', text);
  }

  console.log('\n✅ Crawler finished!');
}

triggerPhotoboothCrawler();
