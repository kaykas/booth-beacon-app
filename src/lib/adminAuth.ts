/**
 * Admin Authentication Module
 * Handles admin user verification and authorization
 */

import { supabase, createServerClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

/**
 * Check if a user is an admin by calling the Supabase is_admin() function
 *
 * @param userId - The user's ID to check
 * @param useServerClient - Whether to use server client (for server components)
 * @returns Promise<boolean> - True if user is admin, false otherwise
 */
export async function isAdmin(userId: string, useServerClient = false): Promise<boolean> {
  try {
    const client = useServerClient ? createServerClient() : supabase;

    // Call the Supabase is_admin() function
    const { data, error } = await client.rpc('is_admin', { user_id: userId } as any);

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in isAdmin check:', error);
    return false;
  }
}

/**
 * Check if a user object is an admin
 * Convenience wrapper around isAdmin
 *
 * @param user - The Supabase user object
 * @param useServerClient - Whether to use server client (for server components)
 * @returns Promise<boolean> - True if user is admin, false otherwise
 */
export async function isUserAdmin(user: User | null, useServerClient = false): Promise<boolean> {
  if (!user) return false;
  return isAdmin(user.id, useServerClient);
}

/**
 * Require admin access - throws error if user is not admin
 * Use this in protected routes and API endpoints
 *
 * @param userId - The user's ID to check
 * @param useServerClient - Whether to use server client (for server components)
 * @throws Error if user is not an admin
 */
export async function requireAdmin(userId: string | null | undefined, useServerClient = false): Promise<void> {
  if (!userId) {
    throw new Error('Authentication required');
  }

  const adminStatus = await isAdmin(userId, useServerClient);

  if (!adminStatus) {
    throw new Error('Admin access required');
  }
}

/**
 * Check admin status for client components
 * Returns an object with loading state and admin status
 *
 * @param user - The Supabase user object
 * @returns Object with isAdmin and loading status
 */
export async function checkAdminStatus(user: User | null): Promise<{
  isAdmin: boolean;
  isLoading: boolean;
}> {
  if (!user) {
    return { isAdmin: false, isLoading: false };
  }

  try {
    const adminStatus = await isUserAdmin(user, false);
    return { isAdmin: adminStatus, isLoading: false };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return { isAdmin: false, isLoading: false };
  }
}
