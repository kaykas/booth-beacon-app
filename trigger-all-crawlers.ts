#!/usr/bin/env tsx

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

async function triggerFullCrawl() {
  console.log('\n=== TRIGGERING FULL CRAWLER RUN ===\n');
  console.log('Starting crawler for all enabled sources...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-crawler?stream=true`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'crawl_all' }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✓ Crawler started successfully');
    console.log('✓ Streaming SSE output...\n');

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let lineCount = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('\n✓ Crawler completed');
            return;
          }
          try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
            lineCount++;

            // Limit output to first 50 events for readability
            if (lineCount >= 50) {
              console.log('\n... (continuing in background, showing first 50 events)');
              return;
            }
          } catch (e) {
            // Ignore parse errors for partial data
          }
        }
      }
    }
  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  }
}

triggerFullCrawl();
