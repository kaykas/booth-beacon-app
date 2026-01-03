import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { createServerClient } from '@/lib/supabase/client';
import { isAdmin } from '@/lib/adminAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ModerationDashboard } from './ModerationDashboard';

export const metadata = {
  title: 'Moderation Dashboard - Admin',
  description: 'Moderate user-generated content',
};

/**
 * Server component that handles authentication and data fetching
 */
export default async function ModerationPage() {
  // Create auth client with cookie access to get logged-in user
  const cookieStore = await cookies();
  const authClient = createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Get current user from auth session
  const {
    data: { user },
  } = await authClient.auth.getUser();

  // Redirect if not logged in
  if (!user) {
    redirect('/');
  }

  // Check if user is admin
  const adminStatus = await isAdmin(user.id, true);
  if (!adminStatus) {
    redirect('/admin');
  }

  // Create service role client for querying moderation data
  const supabase = createServerClient();

  // Fetch initial data for all content types
  const [photosResult, commentsResult] = await Promise.all([
    // Fetch user photos with booth and profile info
    supabase
      .from('booth_user_photos')
      .select(
        `
        *,
        booth:booths!inner(id, name, city, country, slug),
        profile:profiles!inner(id, full_name, email)
      `
      )
      .order('created_at', { ascending: false })
      .limit(100),

    // Fetch comments with booth and profile info
    supabase
      .from('booth_comments')
      .select(
        `
        *,
        booth:booths!inner(id, name, city, country, slug),
        profile:profiles!inner(id, full_name, email)
      `
      )
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  // Handle errors
  if (photosResult.error) {
    console.error('Error fetching photos:', photosResult.error);
  }
  if (commentsResult.error) {
    console.error('Error fetching comments:', commentsResult.error);
  }

  // Type assertion to fix Supabase type inference issue with joins
  type PhotoWithRelations = {
    id: string;
    user_id: string;
    booth_id: string;
    photo_url: string;
    caption: string | null;
    moderation_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    moderated_at: string | null;
    moderated_by: string | null;
    booth: { id: string; name: string; city: string; country: string; slug: string };
    profile: { id: string; full_name: string | null; email: string };
  };

  type CommentWithRelations = {
    id: string;
    user_id: string;
    booth_id: string;
    content: string;
    rating: number;
    moderation_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    moderated_at: string | null;
    moderated_by: string | null;
    booth: { id: string; name: string; city: string; country: string; slug: string };
    profile: { id: string; full_name: string | null; email: string };
  };

  const photos = (photosResult.data as PhotoWithRelations[]) || [];
  const comments = (commentsResult.data as CommentWithRelations[]) || [];

  // Calculate stats
  const stats = {
    photos: {
      total: photos.length,
      pending: photos.filter((p) => p.moderation_status === 'pending').length,
      approved: photos.filter((p) => p.moderation_status === 'approved').length,
      rejected: photos.filter((p) => p.moderation_status === 'rejected').length,
    },
    comments: {
      total: comments.length,
      pending: comments.filter((c) => c.moderation_status === 'pending').length,
      approved: comments.filter((c) => c.moderation_status === 'approved')
        .length,
      rejected: comments.filter((c) => c.moderation_status === 'rejected')
        .length,
    },
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ModerationDashboard
            initialPhotos={photos}
            initialComments={comments}
            stats={stats}
            userId={user.id}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
