/**
 * AI IMAGE GENERATION API
 *
 * Server-Sent Events (SSE) endpoint for generating AI images for booths without photos
 * Uses OpenAI DALL-E 3 to create vintage photobooth aesthetic location images
 *
 * Only processes booths with quality score < 80% AND missing images
 *
 * Cost: ~$0.04 per image (DALL-E 3 standard quality)
 *
 * Usage: GET /api/enrichment/images?batchSize=50
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { calculateQualityScore, determineEnrichmentNeeds, type BoothQualityData } from '@/lib/dataQuality';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface LogEvent {
  type: 'info' | 'error' | 'success' | 'progress';
  message: string;
  data?: unknown;
}

function constructPrompt(booth: BoothQualityData): string {
  let locationDescription = '';

  if (booth.address) {
    locationDescription = `street view of ${booth.address}, ${booth.city}, ${booth.country}`;
  } else {
    locationDescription = `iconic street view of ${booth.city}, ${booth.country}`;
  }

  const styleDirective = `
    Style: Vintage photo booth strip aesthetic.
    The image should have a warm, slightly faded nostalgic look,
    similar to old film photography from the 1960s-1980s.
    Soft edges, slight vignetting, and warm color tones.
    This is a LOCATION VIEW, not a photo booth machine.
  `.trim();

  return `${locationDescription}. ${styleDirective}`;
}

async function generateImage(booth: BoothQualityData): Promise<string | null> {
  try {
    const prompt = constructPrompt(booth);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      return null;
    }

    return imageUrl;
  } catch (error) {
    console.error('DALL-E error:', error);
    return null;
  }
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToSupabase(imageBuffer: Buffer, boothId: string): Promise<string> {
  const fileName = `booth-${boothId}-ai-preview-${Date.now()}.png`;
  const filePath = `ai-previews/${fileName}`;

  const { error } = await supabase.storage
    .from('booth-images')
    .upload(filePath, imageBuffer, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('booth-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

async function updateBooth(boothId: string, imageUrl: string): Promise<void> {
  const { error } = await supabase
    .from('booths')
    .update({
      ai_preview_url: imageUrl,
      ai_preview_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', boothId);

  if (error) {
    throw new Error(`Database update failed: ${error.message}`);
  }
}

async function processBooth(booth: BoothQualityData, log: (event: LogEvent) => void): Promise<boolean> {
  try {
    const score = calculateQualityScore(booth);
    const needs = determineEnrichmentNeeds(booth);

    log({
      type: 'info',
      message: `${booth.name} (${booth.city}) - Quality: ${score.score}%`,
    });

    if (!needs.needsImage) {
      log({
        type: 'info',
        message: 'Image already exists, skipping',
      });
      return false;
    }

    // Generate image
    log({ type: 'progress', message: 'Generating AI image...' });
    const tempImageUrl = await generateImage(booth);

    if (!tempImageUrl) {
      log({ type: 'error', message: 'Image generation failed' });
      return false;
    }

    // Download
    log({ type: 'progress', message: 'Downloading image...' });
    const imageBuffer = await downloadImage(tempImageUrl);

    // Upload to Supabase
    log({ type: 'progress', message: 'Uploading to storage...' });
    const permanentUrl = await uploadToSupabase(imageBuffer, booth.id);

    // Update booth
    log({ type: 'progress', message: 'Updating database...' });
    await updateBooth(booth.id, permanentUrl);

    // Recalculate score
    const { data: updatedBooth } = await supabase
      .from('booths')
      .select('*')
      .eq('id', booth.id)
      .single();

    if (updatedBooth) {
      const newScore = calculateQualityScore(updatedBooth as BoothQualityData);
      log({
        type: 'success',
        message: `Image generated (${score.score}% → ${newScore.score}%)`,
      });
    }

    return true;
  } catch (error: unknown) {
    log({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchSize = parseInt(searchParams.get('batchSize') || '50');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const log = (event: LogEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        log({ type: 'info', message: 'Starting AI image generation...' });

        // Query booths without images
        const { data: booths, error } = await supabase
          .from('booths')
          .select('id, name, city, state, country, address, phone, website, hours, photo_exterior_url, ai_preview_url, photos, google_place_id, latitude, longitude, status')
          .eq('status', 'active')
          .is('photo_exterior_url', null)
          .is('ai_preview_url', null)
          .limit(batchSize);

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        if (!booths || booths.length === 0) {
          log({ type: 'success', message: 'All booths already have images!' });
          controller.close();
          return;
        }

        const estimatedCost = booths.length * 0.04;
        log({
          type: 'info',
          message: `Found ${booths.length} booths needing images (Est. cost: $${estimatedCost.toFixed(2)})`,
        });

        let succeeded = 0;
        let failed = 0;

        for (let i = 0; i < booths.length; i++) {
          log({ type: 'progress', message: `Processing ${i + 1}/${booths.length}` });

          const success = await processBooth(booths[i] as BoothQualityData, log);

          if (success) {
            succeeded++;
          } else {
            failed++;
          }

          // Rate limiting between images
          if (i < booths.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1200));
          }
        }

        const actualCost = succeeded * 0.04;
        log({
          type: 'success',
          message: `Completed: ${succeeded} generated, ${failed} failed (Cost: $${actualCost.toFixed(2)})`,
        });

        controller.close();
      } catch (error: unknown) {
        log({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
