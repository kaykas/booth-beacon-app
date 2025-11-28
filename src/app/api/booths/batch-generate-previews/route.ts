/**
 * API Route: Batch Generate AI Previews
 * Generates AI preview images for multiple booths that don't have photos
 * Useful for admin operations to populate AI previews for the entire database
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateLocationImage,
  uploadGeneratedImage,
  updateBoothAIPreview,
} from '@/lib/imageGeneration';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes max

interface BatchProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ boothId: string; error: string }>;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { limit = 10, dryRun = false } = body;

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          }
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch booths that need AI previews
    // (no photo_exterior_url and no ai_preview_url)
    const { data: booths, error: fetchError } = await supabase
      .from('booths')
      .select('id, name, city, country, address')
      .is('photo_exterior_url', null)
      .is('ai_preview_url', null)
      .limit(limit);

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch booths: ${fetchError.message}` },
        {
          status: 500,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          }
        }
      );
    }

    if (!booths || booths.length === 0) {
      return NextResponse.json(
        {
          message: 'No booths found that need AI previews',
          progress: {
            total: 0,
            processed: 0,
            successful: 0,
            failed: 0,
            errors: [],
          },
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          }
        }
      );
    }

    if (dryRun) {
      return NextResponse.json(
        {
          message: `Dry run: ${booths.length} booths would be processed`,
          booths: booths.map((b) => ({
            id: b.id,
            name: b.name,
            location: `${b.city}, ${b.country}`,
          })),
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          }
        }
      );
    }

    // Process booths one by one
    const progress: BatchProgress = {
      total: booths.length,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const booth of booths) {
      try {
        console.log(`Processing booth ${booth.id}: ${booth.name}`);

        // Generate AI image
        const result = await generateLocationImage({
          city: booth.city,
          country: booth.country,
          address: booth.address,
          boothName: booth.name,
        });

        if (!result.success || !result.imageUrl) {
          throw new Error(result.error || 'Image generation failed');
        }

        // Upload to Supabase if needed
        let finalImageUrl = result.imageUrl;
        if (result.imageUrl.startsWith('data:')) {
          finalImageUrl = await uploadGeneratedImage(result.imageUrl, booth.id);
        }

        // Update booth record
        await updateBoothAIPreview(booth.id, finalImageUrl);

        progress.successful++;
        console.log(`Successfully processed booth ${booth.id}`);
      } catch (error) {
        progress.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        progress.errors.push({
          boothId: booth.id,
          error: errorMessage,
        });
        console.error(`Failed to process booth ${booth.id}:`, error);
      } finally {
        progress.processed++;
      }

      // Add a small delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return NextResponse.json(
      {
        message: `Batch processing completed`,
        progress,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in batch-generate-previews API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check how many booths need AI previews
 */
export async function GET(request: NextRequest) {
  try {
    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          }
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Count booths that need AI previews
    const { count: needsPreview, error: countError1 } = await supabase
      .from('booths')
      .select('id', { count: 'exact', head: true })
      .is('photo_exterior_url', null)
      .is('ai_preview_url', null);

    // Count booths with photos
    const { count: hasPhoto, error: countError2 } = await supabase
      .from('booths')
      .select('id', { count: 'exact', head: true })
      .not('photo_exterior_url', 'is', null);

    // Count booths with AI previews
    const { count: hasAIPreview, error: countError3 } = await supabase
      .from('booths')
      .select('id', { count: 'exact', head: true })
      .not('ai_preview_url', 'is', null);

    // Total booths
    const { count: total, error: countError4 } = await supabase
      .from('booths')
      .select('id', { count: 'exact', head: true });

    if (countError1 || countError2 || countError3 || countError4) {
      return NextResponse.json(
        { error: 'Failed to count booths' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          }
        }
      );
    }

    return NextResponse.json(
      {
        total: total || 0,
        needsPreview: needsPreview || 0,
        hasPhoto: hasPhoto || 0,
        hasAIPreview: hasAIPreview || 0,
        coverage: total ? (((hasPhoto || 0) + (hasAIPreview || 0)) / total) * 100 : 0,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        }
      }
    );
  } catch (error) {
    console.error('Error checking preview status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
