import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { submitBoothAndRelated } from '@/lib/indexnow/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function POST(request: NextRequest) {
  try {
    const { submissionId, adminNotes } = await request.json();

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the submission
    const { data: submission, error: fetchError } = await supabase
      .from('booth_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: 'Submission has already been reviewed' },
        { status: 400 }
      );
    }

    // Generate slug for the booth
    const slug = generateSlug(submission.name);

    // Check if slug already exists and make it unique if necessary
    let finalSlug = slug;
    let counter = 1;
    while (true) {
      const { data: existing } = await supabase
        .from('booths')
        .select('id')
        .eq('slug', finalSlug)
        .single();

      if (!existing) break;
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // Create booth from submission
    const boothData = {
      name: submission.name,
      slug: finalSlug,
      address: submission.address,
      city: submission.city,
      state: submission.state,
      country: submission.country,
      postal_code: submission.postal_code,
      machine_model: submission.machine_model,
      booth_type: submission.booth_type,
      photo_type: submission.photo_type,
      cost: submission.cost,
      hours: submission.hours,
      accepts_cash: submission.accepts_cash,
      accepts_card: submission.accepts_card,
      description: submission.description,
      photo_exterior_url: submission.photo_url,
      status: 'unverified', // Booths start as unverified, can be promoted to active later
      is_operational: true,
      ingested_by: 'contributor',
      source_primary: 'user_submission',
    };

    const { data: newBooth, error: boothError } = await supabase
      .from('booths')
      .insert([boothData])
      .select()
      .single();

    if (boothError) {
      console.error('Error creating booth:', boothError);
      return NextResponse.json(
        { error: 'Failed to create booth', details: boothError.message },
        { status: 500 }
      );
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('booth_submissions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
        approved_booth_id: newBooth.id,
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      // Booth was created but submission status update failed
      // This is not critical, log and continue
    }

    // Notify search engines via IndexNow (non-blocking)
    submitBoothAndRelated({
      slug: finalSlug,
      city: submission.city,
      state: submission.state,
      country: submission.country,
    }).catch((error) => {
      console.error('IndexNow notification failed:', error);
      // Non-critical, don't fail the request
    });

    return NextResponse.json({
      success: true,
      boothId: newBooth.id,
      slug: finalSlug,
    });
  } catch (error) {
    console.error('Error in approve submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
