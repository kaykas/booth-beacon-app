// Geocoding Edge Function for Booth Beacon
// Uses OpenStreetMap Nominatim API (free, no API key required)
// Respects rate limits: 1 request per second

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'BoothBeacon/1.0 (photobooth directory)';
const RATE_LIMIT_MS = 1000; // 1 request per second

interface GeocodeResult {
  booth_id: string;
  name: string;
  address: string;
  success: boolean;
  latitude?: number;
  longitude?: number;
  error?: string;
}

interface StreamEvent {
  type: 'start' | 'progress' | 'complete' | 'error' | 'booth_geocoded' | 'booth_failed';
  message?: string;
  data?: any;
}

async function geocodeAddress(address: string, city: string, country: string): Promise<{ lat: number; lng: number } | null> {
  // Build search query - prioritize full address
  const query = `${address}, ${city}, ${country}`.trim();

  const url = new URL(NOMINATIM_BASE_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const results = await response.json();

    if (results && results.length > 0) {
      const result = results[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
    }

    return null;
  } catch (error: any) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sendEvent(controller: ReadableStreamDefaultController, event: StreamEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  controller.enqueue(new TextEncoder().encode(data));
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Parse request body
  let limit = 50; // Default limit
  let dryRun = false;

  try {
    const body = await req.json();
    if (body.limit) limit = parseInt(body.limit);
    if (body.dry_run) dryRun = body.dry_run;
  } catch {
    // Use defaults if body parsing fails
  }

  // Set up Server-Sent Events stream
  const stream = new ReadableStream({
    async start(controller) {
      const results: GeocodeResult[] = [];
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      try {
        sendEvent(controller, {
          type: 'start',
          message: `Starting geocoding process (limit: ${limit}, dry_run: ${dryRun})...`,
        });

        // Find booths missing coordinates
        const { data: booths, error: fetchError } = await supabase
          .from('booths')
          .select('id, name, address, city, country, latitude, longitude')
          .or('latitude.is.null,longitude.is.null')
          .limit(limit);

        if (fetchError) {
          throw new Error(`Failed to fetch booths: ${fetchError.message}`);
        }

        if (!booths || booths.length === 0) {
          sendEvent(controller, {
            type: 'complete',
            message: 'No booths found missing coordinates',
            data: { total: 0, success: 0, errors: 0, skipped: 0 },
          });
          controller.close();
          return;
        }

        sendEvent(controller, {
          type: 'progress',
          message: `Found ${booths.length} booths missing coordinates`,
          data: { total: booths.length },
        });

        // Process each booth
        for (let i = 0; i < booths.length; i++) {
          const booth = booths[i];

          try {
            // Skip if missing required fields
            if (!booth.address || !booth.city || !booth.country) {
              skippedCount++;
              sendEvent(controller, {
                type: 'booth_failed',
                message: `Skipped ${booth.name}: missing address fields`,
                data: {
                  booth_id: booth.id,
                  name: booth.name,
                  index: i + 1,
                  total: booths.length
                },
              });
              results.push({
                booth_id: booth.id,
                name: booth.name,
                address: booth.address || '',
                success: false,
                error: 'Missing address fields',
              });
              continue;
            }

            // Geocode the address
            const coords = await geocodeAddress(booth.address, booth.city, booth.country);

            if (coords) {
              // Update booth with coordinates (unless dry run)
              if (!dryRun) {
                const { error: updateError } = await supabase
                  .from('booths')
                  .update({
                    latitude: coords.lat,
                    longitude: coords.lng,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', booth.id);

                if (updateError) {
                  throw new Error(`Failed to update booth: ${updateError.message}`);
                }
              }

              successCount++;
              sendEvent(controller, {
                type: 'booth_geocoded',
                message: `✓ ${booth.name} (${i + 1}/${booths.length})`,
                data: {
                  booth_id: booth.id,
                  name: booth.name,
                  latitude: coords.lat,
                  longitude: coords.lng,
                  index: i + 1,
                  total: booths.length,
                  dry_run: dryRun,
                },
              });

              results.push({
                booth_id: booth.id,
                name: booth.name,
                address: booth.address,
                success: true,
                latitude: coords.lat,
                longitude: coords.lng,
              });
            } else {
              errorCount++;
              sendEvent(controller, {
                type: 'booth_failed',
                message: `✗ ${booth.name}: No coordinates found`,
                data: {
                  booth_id: booth.id,
                  name: booth.name,
                  index: i + 1,
                  total: booths.length,
                },
              });

              results.push({
                booth_id: booth.id,
                name: booth.name,
                address: booth.address,
                success: false,
                error: 'No coordinates found',
              });
            }

            // Rate limiting: wait 1 second between requests
            if (i < booths.length - 1) {
              await sleep(RATE_LIMIT_MS);
            }

          } catch (error: any) {
            errorCount++;
            sendEvent(controller, {
              type: 'booth_failed',
              message: `✗ ${booth.name}: ${error.message}`,
              data: {
                booth_id: booth.id,
                name: booth.name,
                error: error.message,
                index: i + 1,
                total: booths.length,
              },
            });

            results.push({
              booth_id: booth.id,
              name: booth.name,
              address: booth.address || '',
              success: false,
              error: error.message,
            });

            // Rate limiting even on errors
            if (i < booths.length - 1) {
              await sleep(RATE_LIMIT_MS);
            }
          }
        }

        // Send completion event
        sendEvent(controller, {
          type: 'complete',
          message: `Geocoding complete: ${successCount} successful, ${errorCount} errors, ${skippedCount} skipped`,
          data: {
            total: booths.length,
            success: successCount,
            errors: errorCount,
            skipped: skippedCount,
            results,
            dry_run: dryRun,
          },
        });

      } catch (error: any) {
        console.error('Geocoding process error:', error);
        sendEvent(controller, {
          type: 'error',
          message: error.message || 'Unknown error occurred',
          data: { error: error.message },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
