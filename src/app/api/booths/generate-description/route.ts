import { NextRequest, NextResponse } from 'next/server';
import { generateBoothDescription, updateBoothDescription } from '@/lib/ai/descriptionGeneration';
import { createPublicServerClient } from '@/lib/supabase';

/**
 * API endpoint to generate AI descriptions for booths
 * GET /api/booths/generate-description?boothId=xxx
 * GET /api/booths/generate-description?batch=true&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boothId = searchParams.get('boothId');
    const batch = searchParams.get('batch') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Single booth generation
    if (boothId && !batch) {
      const supabase = createPublicServerClient();
      const { data: booth, error } = await supabase
        .from('booths')
        .select('*')
        .eq('id', boothId)
        .single();

      if (error || !booth) {
        return NextResponse.json(
          { error: 'Booth not found' },
          { status: 404 }
        );
      }

      const result = await generateBoothDescription(booth);

      if (result.success && result.description) {
        await updateBoothDescription(boothId, result.description);
        return NextResponse.json({
          success: true,
          boothId,
          description: result.description,
        });
      }

      return NextResponse.json(
        { error: result.error || 'Failed to generate description' },
        { status: 500 }
      );
    }

    // Batch generation
    if (batch) {
      const supabase = createPublicServerClient();
      const { data: booths, error } = await supabase
        .from('booths')
        .select('*')
        .or('description.is.null,description.eq.')
        .eq('status', 'active')
        .limit(limit);

      if (error || !booths) {
        return NextResponse.json(
          { error: 'Failed to fetch booths' },
          { status: 500 }
        );
      }

      const results = [];
      for (const booth of booths) {
        const result = await generateBoothDescription(booth);

        if (result.success && result.description) {
          await updateBoothDescription(booth.id, result.description);
          results.push({
            boothId: booth.id,
            boothName: booth.name,
            success: true,
          });
        } else {
          results.push({
            boothId: booth.id,
            boothName: booth.name,
            success: false,
            error: result.error,
          });
        }

        // Rate limiting: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return NextResponse.json({
        success: true,
        processed: results.length,
        results,
      });
    }

    return NextResponse.json(
      { error: 'Missing required parameters: boothId or batch=true' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in generate-description API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
