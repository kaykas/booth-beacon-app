'use server';

import { createServerClient } from '@/lib/supabase/client';
import { requireAdmin } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';

export interface ModerationActionResult {
  success: boolean;
  error?: string;
}

/**
 * Moderate a user photo
 */
export async function moderatePhoto(
  photoId: string,
  status: 'approved' | 'rejected',
  userId: string
): Promise<ModerationActionResult> {
  try {
    // Check admin access
    await requireAdmin(userId, true);

    const supabase = createServerClient();

    // Update photo moderation status
    const { error } = await supabase
      .from('booth_user_photos')
      .update({
        moderation_status: status,
        moderated_at: new Date().toISOString(),
        moderated_by: userId,
      })
      .eq('id', photoId);

    if (error) {
      console.error('Error moderating photo:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/moderation');
    return { success: true };
  } catch (error) {
    console.error('Error in moderatePhoto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a user photo
 */
export async function deletePhoto(
  photoId: string,
  userId: string
): Promise<ModerationActionResult> {
  try {
    // Check admin access
    await requireAdmin(userId, true);

    const supabase = createServerClient();

    // Delete photo
    const { error } = await supabase
      .from('booth_user_photos')
      .delete()
      .eq('id', photoId);

    if (error) {
      console.error('Error deleting photo:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/moderation');
    return { success: true };
  } catch (error) {
    console.error('Error in deletePhoto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Moderate a comment/review
 */
export async function moderateComment(
  commentId: string,
  status: 'approved' | 'rejected',
  userId: string
): Promise<ModerationActionResult> {
  try {
    // Check admin access
    await requireAdmin(userId, true);

    const supabase = createServerClient();

    // Update comment moderation status
    const { error } = await supabase
      .from('booth_comments')
      .update({
        moderation_status: status,
        moderated_at: new Date().toISOString(),
        moderated_by: userId,
      })
      .eq('id', commentId);

    if (error) {
      console.error('Error moderating comment:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/moderation');
    return { success: true };
  } catch (error) {
    console.error('Error in moderateComment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a comment/review
 */
export async function deleteComment(
  commentId: string,
  userId: string
): Promise<ModerationActionResult> {
  try {
    // Check admin access
    await requireAdmin(userId, true);

    const supabase = createServerClient();

    // Delete comment
    const { error } = await supabase
      .from('booth_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/moderation');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteComment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch moderate items
 */
export async function batchModerate(
  itemIds: string[],
  status: 'approved' | 'rejected',
  contentType: 'photos' | 'comments',
  userId: string
): Promise<ModerationActionResult> {
  try {
    // Check admin access
    await requireAdmin(userId, true);

    const supabase = createServerClient();

    const tableName =
      contentType === 'photos' ? 'booth_user_photos' : 'booth_comments';

    // Update multiple items
    const { error } = await supabase
      .from(tableName)
      .update({
        moderation_status: status,
        moderated_at: new Date().toISOString(),
        moderated_by: userId,
      })
      .in('id', itemIds);

    if (error) {
      console.error('Error batch moderating:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/moderation');
    return { success: true };
  } catch (error) {
    console.error('Error in batchModerate:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
