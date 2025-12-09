// Geocoding Edge Function for Booth Beacon with 4-Layer Validation
// Uses OpenStreetMap Nominatim API (free, no API key required)
// Respects rate limits: 1 request per second
// Implements comprehensive validation to prevent incorrect geocoding

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  type NominatimResult,
  validateAddressCompleteness,
  performFinalValidation,
  shouldFlagForReview,
} from './validation.ts';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'BoothBeacon/1.0 (photobooth directory)';
const RATE_LIMIT_MS = 1000; // 1 request per second

interface BoothData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

interface GeocodeResult {
  booth_id: string;
  name: string;
  address: string;
  success: boolean;
  latitude?: number;
  longitude?: number;
  confidence?: string;
  issues?: string[];
  needsReview?: boolean;
  error?: string;
}

interface StreamEvent {
  type: 'start' | 'progress' | 'complete' | 'error' | 'booth_geocoded' | 'booth_failed' | 'booth_skipped';
  message?: string;
  data?: any;
}

async function geocodeAddress(
  booth: BoothData
): Promise<{ coords: { lat: number; lng: number }; result: NominatimResult } | null> {
  // Build search query - prioritize full address
  const query = `${booth.address}, ${booth.city}, ${booth.country}`.trim();

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
      const result = results[0] as NominatimResult;
      return {
        coords: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        },
        result,
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
      let validationRejectCount = 0;

      try {
        sendEvent(controller, {
          type: 'start',
          message: `Starting geocoding with 4-layer validation (limit: ${limit}, dry_run: ${dryRun})...`,
        });

        // Find booths missing coordinates
        const { data: booths, error: fetchError } = await supabase
          .from('booths')
          .select('id, name, address, city, state, country, latitude, longitude')
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
          const booth = booths[i] as BoothData;

          try {
            // Skip if missing required fields
            if (!booth.address || !booth.city || !booth.country) {
              skippedCount++;
              sendEvent(controller, {
                type: 'booth_skipped',
                message: `⊘ Skipped ${booth.name}: missing address fields`,
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

            // LAYER 1: Pre-geocoding validation
            const preValidation = validateAddressCompleteness({
              name: booth.name,
              address: booth.address,
              city: booth.city,
              state: booth.state,
              country: booth.country,
            });

            if (!preValidation.isValid || preValidation.confidence === 'reject') {
              validationRejectCount++;
              sendEvent(controller, {
                type: 'booth_skipped',
                message: `⊘ Rejected ${booth.name}: ${preValidation.issues.join(', ')}`,
                data: {
                  booth_id: booth.id,
                  name: booth.name,
                  validation: preValidation,
                  index: i + 1,
                  total: booths.length,
                },
              });
              results.push({
                booth_id: booth.id,
                name: booth.name,
                address: booth.address,
                success: false,
                error: `Validation failed: ${preValidation.issues.join(', ')}`,
                confidence: preValidation.confidence,
                issues: preValidation.issues,
              });
              continue;
            }

            // Geocode the address
            const geocodeResponse = await geocodeAddress(booth);

            if (geocodeResponse) {
              const { coords, result } = geocodeResponse;

              // LAYERS 2-4: Post-geocoding validation
              const validation = performFinalValidation(
                {
                  name: booth.name,
                  address: booth.address,
                  city: booth.city,
                  state: booth.state,
                  country: booth.country,
                },
                result,
                booth.latitude,
                booth.longitude
              );

              // Check if validation passed
              if (!validation.isValid) {
                validationRejectCount++;
                sendEvent(controller, {
                  type: 'booth_failed',
                  message: `✗ ${booth.name}: Validation failed - ${validation.issues.join(', ')}`,
                  data: {
                    booth_id: booth.id,
                    name: booth.name,
                    validation,
                    index: i + 1,
                    total: booths.length,
                  },
                });

                results.push({
                  booth_id: booth.id,
                  name: booth.name,
                  address: booth.address,
                  success: false,
                  error: `Validation failed: ${validation.issues.join(', ')}`,
                  confidence: validation.confidence,
                  issues: validation.issues,
                });
                continue;
              }

              // Determine if needs manual review
              const needsReview = shouldFlagForReview(validation);

              // Update booth with coordinates and validation metadata (unless dry run)
              if (!dryRun) {
                const { error: updateError } = await supabase
                  .from('booths')
                  .update({
                    latitude: coords.lat,
                    longitude: coords.lng,
                    geocode_provider: 'nominatim',
                    geocode_confidence: validation.confidence,
                    geocode_match_score: validation.metadata.geocodeValidation?.matchScore ?? null,
                    geocode_validation_issues: validation.issues.length > 0 ? validation.issues : null,
                    geocode_validated_at: new Date().toISOString(),
                    needs_geocode_review: needsReview,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', booth.id);

                if (updateError) {
                  throw new Error(`Failed to update booth: ${updateError.message}`);
                }
              }

              successCount++;

              const reviewFlag = needsReview ? ' [NEEDS REVIEW]' : '';
              const confidenceEmoji = validation.confidence === 'high' ? '✓' :
                                     validation.confidence === 'medium' ? '○' : '△';

              sendEvent(controller, {
                type: 'booth_geocoded',
                message: `${confidenceEmoji} ${booth.name} (${i + 1}/${booths.length}) - ${validation.confidence} confidence${reviewFlag}`,
                data: {
                  booth_id: booth.id,
                  name: booth.name,
                  latitude: coords.lat,
                  longitude: coords.lng,
                  confidence: validation.confidence,
                  matchScore: validation.metadata.geocodeValidation?.matchScore,
                  needsReview,
                  issues: validation.issues.length > 0 ? validation.issues : undefined,
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
                confidence: validation.confidence,
                issues: validation.issues.length > 0 ? validation.issues : undefined,
                needsReview,
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

        // Count booths needing review
        const reviewCount = results.filter(r => r.needsReview).length;

        // Send completion event
        sendEvent(controller, {
          type: 'complete',
          message: `Geocoding complete: ${successCount} successful, ${errorCount} errors, ${skippedCount} skipped, ${validationRejectCount} validation rejected, ${reviewCount} need review`,
          data: {
            total: booths.length,
            success: successCount,
            errors: errorCount,
            skipped: skippedCount,
            validationRejected: validationRejectCount,
            needsReview: reviewCount,
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
