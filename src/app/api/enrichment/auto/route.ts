/**
 * AUTO-ENRICHMENT API
 *
 * Automatically enriches newly crawled booths to 80% quality
 * Called by crawler after adding new booths to database
 *
 * Process:
 * 1. Receives array of booth IDs
 * 2. Calculates quality score for each
 * 3. Runs venue enrichment if needed
 * 4. Runs image generation if needed
 * 5. Continues until quality >= 80%
 *
 * Usage: POST /api/enrichment/auto
 * Body: { boothIds: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateQualityScore, determineEnrichmentNeeds, type BoothQualityData } from '@/lib/dataQuality';
import { getRequiredEnv } from '@/lib/utils';

const supabase = createClient(
  getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
  getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
);

interface _EnrichmentRequest {
  boothIds: string[];
}

interface EnrichmentResult {
  boothId: string;
  initialScore: number;
  finalScore: number;
  enrichmentsApplied: string[];
  errors?: string[];
  success: boolean;
}

async function _enrichBooth(boothId: string): Promise<EnrichmentResult> {
  const enrichmentsApplied: string[] = [];
  const errors: string[] = [];

  try {
    // Fetch booth data
    const { data: booth, error } = await supabase
      .from('booths')
      .select('*')
      .eq('id', boothId)
      .single();

    if (error || !booth) {
      throw new Error(`Booth not found: ${boothId}`);
    }

    const initialScore = calculateQualityScore(booth as BoothQualityData);
    const needs = determineEnrichmentNeeds(booth as BoothQualityData);

    // Skip if already high quality
    if (initialScore.score >= 80) {
      return {
        boothId,
        initialScore: initialScore.score,
        finalScore: initialScore.score,
        enrichmentsApplied: [],
        success: true,
      };
    }

    // Apply venue enrichment if needed
    if (needs.needsVenueData) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          const venueResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/enrichment/venue?batchSize=1&boothId=${boothId}`,
            { signal: controller.signal }
          );
          if (venueResponse.ok) {
            enrichmentsApplied.push('venue');
          } else {
            const errorMsg = `Venue enrichment returned status ${venueResponse.status}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        let errorMsg = 'Venue enrichment failed';
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMsg = 'Venue enrichment timed out after 30 seconds';
          } else {
            errorMsg = `Venue enrichment failed: ${error.message}`;
          }
        }
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Apply image generation if needed
    if (needs.needsImage) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          const imageResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/enrichment/images?batchSize=1&boothId=${boothId}`,
            { signal: controller.signal }
          );
          if (imageResponse.ok) {
            enrichmentsApplied.push('image');
          } else {
            const errorMsg = `Image enrichment returned status ${imageResponse.status}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        let errorMsg = 'Image enrichment failed';
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMsg = 'Image enrichment timed out after 30 seconds';
          } else {
            errorMsg = `Image enrichment failed: ${error.message}`;
          }
        }
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Fetch updated booth
    const { data: updatedBooth } = await supabase
      .from('booths')
      .select('*')
      .eq('id', boothId)
      .single();

    const finalScore = updatedBooth
      ? calculateQualityScore(updatedBooth as BoothQualityData)
      : initialScore;

    return {
      boothId,
      initialScore: initialScore.score,
      finalScore: finalScore.score,
      enrichmentsApplied,
      errors: errors.length > 0 ? errors : undefined,
      success: enrichmentsApplied.length > 0 || initialScore.score >= 80,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return {
      boothId,
      initialScore: 0,
      finalScore: 0,
      enrichmentsApplied,
      errors: [errorMsg],
      success: false,
    };
  }
}

export async function POST(_request: NextRequest) {
  // DISABLED: Auto-enrichment disabled until data quality issues are resolved
  // This endpoint should only be manually triggered from admin panel after verification
  return NextResponse.json(
    {
      error: 'Auto-enrichment is currently disabled. Use manual enrichment from /admin/enrichment instead.',
      disabled: true
    },
    { status: 503 }
  );

  // Original code preserved below for re-enabling after data quality fixes
  /*
  try {
    const body: EnrichmentRequest = await request.json();
    const { boothIds } = body;

    if (!boothIds || !Array.isArray(boothIds)) {
      return NextResponse.json(
        { error: 'Missing or invalid boothIds array' },
        { status: 400 }
      );
    }

    // Enrich each booth
    const results: EnrichmentResult[] = [];

    for (const boothId of boothIds) {
      const result = await enrichBooth(boothId);
      results.push(result);

      // Rate limiting between booths
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const successful = results.filter(r => r.success).length;
    const improved = results.filter(r => r.finalScore > r.initialScore).length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful,
      improved,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
  */
}
