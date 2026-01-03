import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoId, photoIds, status, userId } = body;

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 401 }
      );
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status is required' },
        { status: 400 }
      );
    }

    // Check admin access
    await requireAdmin(userId, true);

    const supabase = createServerClient();

    // Handle batch moderation
    if (photoIds && Array.isArray(photoIds)) {
      if (photoIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No photo IDs provided' },
          { status: 400 }
        );
      }

      // Update multiple photos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('booth_user_photos') as any)
        .update({
          moderation_status: status,
          moderated_at: new Date().toISOString(),
          moderated_by: userId,
        })
        .in('id', photoIds);

      if (error) {
        console.error('Error batch moderating photos:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${photoIds.length} photo${photoIds.length > 1 ? 's' : ''} ${status}`,
      });
    }

    // Handle single photo moderation
    if (!photoId) {
      return NextResponse.json(
        { success: false, error: 'Photo ID is required' },
        { status: 400 }
      );
    }

    // Update single photo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('booth_user_photos') as any)
      .update({
        moderation_status: status,
        moderated_at: new Date().toISOString(),
        moderated_by: userId,
      })
      .eq('id', photoId);

    if (error) {
      console.error('Error moderating photo:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Photo ${status}`,
    });
  } catch (error) {
    console.error('Error in photo moderation API:', error);

    // Handle admin authentication errors
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
