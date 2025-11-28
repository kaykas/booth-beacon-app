/**
 * API Route: Generate AI Preview Image for Booth
 * Generates a vintage photo booth strip style image of the booth's location
 * when no actual photo is available
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateLocationImage,
  uploadGeneratedImage,
  updateBoothAIPreview,
} from '@/lib/imageGeneration';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const maxDuration = 60; // 1 minute max

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { boothId } = body;

    if (!boothId) {
      return NextResponse.json(
        { error: 'Booth ID is required' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          }
        }
      );
    }

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

    // Fetch booth details
    const { data: booth, error: fetchError } = await supabase
      .from('booths')
      .select('id, name, city, country, address, photo_exterior_url, ai_preview_url')
      .eq('id', boothId)
      .single();

    if (fetchError || !booth) {
      return NextResponse.json(
        { error: 'Booth not found' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          }
        }
      );
    }

    // Check if booth already has a photo or AI preview
    if (booth.photo_exterior_url) {
      return NextResponse.json(
        {
          message: 'Booth already has a photo',
          photoUrl: booth.photo_exterior_url,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          }
        }
      );
    }

    if (booth.ai_preview_url) {
      return NextResponse.json(
        {
          message: 'Booth already has an AI preview',
          aiPreviewUrl: booth.ai_preview_url,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          }
        }
      );
    }

    // Generate the AI image
    console.log(`Generating AI preview for booth: ${booth.name} (${booth.id})`);

    const result = await generateLocationImage({
      city: booth.city,
      country: booth.country,
      address: booth.address,
      boothName: booth.name,
    });

    if (!result.success || !result.imageUrl) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate image' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          }
        }
      );
    }

    console.log(`AI image generated successfully for booth ${booth.id}`);

    // Upload the image to Supabase storage (if it's a data URL)
    let finalImageUrl = result.imageUrl;

    if (result.imageUrl.startsWith('data:')) {
      console.log(`Uploading image to Supabase storage for booth ${booth.id}`);
      finalImageUrl = await uploadGeneratedImage(result.imageUrl, booth.id);
      console.log(`Image uploaded to: ${finalImageUrl}`);
    }

    // Update booth record with the AI preview URL
    await updateBoothAIPreview(booth.id, finalImageUrl);

    console.log(`Booth ${booth.id} updated with AI preview URL`);

    return NextResponse.json(
      {
        success: true,
        boothId: booth.id,
        aiPreviewUrl: finalImageUrl,
        message: 'AI preview generated successfully',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        }
      }
    );
  } catch (error: any) {
    console.error('Error in generate-preview API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        }
      }
    );
  }
}

/**
 * GET endpoint to check if a booth needs an AI preview
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boothId = searchParams.get('boothId');

    if (!boothId) {
      return NextResponse.json(
        { error: 'Booth ID is required' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          }
        }
      );
    }

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

    // Fetch booth details
    const { data: booth, error: fetchError } = await supabase
      .from('booths')
      .select('id, photo_exterior_url, ai_preview_url, ai_preview_generated_at')
      .eq('id', boothId)
      .single();

    if (fetchError || !booth) {
      return NextResponse.json(
        { error: 'Booth not found' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          }
        }
      );
    }

    const needsPreview = !booth.photo_exterior_url && !booth.ai_preview_url;

    return NextResponse.json(
      {
        boothId: booth.id,
        needsPreview,
        hasPhoto: !!booth.photo_exterior_url,
        hasAIPreview: !!booth.ai_preview_url,
        aiPreviewGeneratedAt: booth.ai_preview_generated_at,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        }
      }
    );
  } catch (error: any) {
    console.error('Error checking booth preview status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        }
      }
    );
  }
}
