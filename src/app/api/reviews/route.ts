import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createPublicServerClient } from '@/lib/supabase';

// Types for review data
interface ReviewSubmission {
  booth_id: string;
  rating: number;
  review_text?: string;
  photos?: string[];
  anonymous_name?: string;
  anonymous_email?: string;
}

interface ReviewResponse {
  id: string;
  booth_id: string;
  user_id: string | null;
  rating: number;
  review_text: string | null;
  photos: string[];
  status: 'pending' | 'approved' | 'rejected';
  anonymous_name: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/reviews?booth_id=xxx
 * Fetch approved reviews for a specific booth
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const boothId = searchParams.get('booth_id');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortBy = searchParams.get('sort') || 'recent'; // recent, helpful, highest, lowest

    if (!boothId) {
      return NextResponse.json(
        { error: 'booth_id is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(boothId)) {
      return NextResponse.json(
        { error: 'Invalid booth_id format' },
        { status: 400 }
      );
    }

    const supabase = createPublicServerClient();

    // Build query for approved reviews
    let query = supabase
      .from('booth_reviews')
      .select('*')
      .eq('booth_id', boothId)
      .eq('status', 'approved');

    // Apply sorting
    switch (sortBy) {
      case 'helpful':
        query = query.order('helpful_count', { ascending: false });
        break;
      case 'highest':
        query = query.order('rating', { ascending: false });
        break;
      case 'lowest':
        query = query.order('rating', { ascending: true });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: reviews, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('booth_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('booth_id', boothId)
      .eq('status', 'approved');

    if (countError) {
      console.error('Error counting reviews:', countError);
    }

    // Get aggregate stats
    const { data: stats, error: statsError } = await supabase
      .from('booth_reviews')
      .select('rating')
      .eq('booth_id', boothId)
      .eq('status', 'approved');

    let aggregateStats = {
      average_rating: 0,
      total_reviews: 0,
      rating_distribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    };

    if (!statsError && stats && stats.length > 0) {
      const totalRating = stats.reduce((sum, r) => sum + r.rating, 0);
      aggregateStats.average_rating = Math.round((totalRating / stats.length) * 10) / 10;
      aggregateStats.total_reviews = stats.length;
      stats.forEach((r) => {
        aggregateStats.rating_distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
      });
    }

    return NextResponse.json({
      reviews: reviews || [],
      total: count || 0,
      offset,
      limit,
      stats: aggregateStats,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Submit a new review for a booth
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      booth_id,
      rating,
      review_text,
      photos,
      anonymous_name,
      anonymous_email,
    }: ReviewSubmission = body;

    // Validation
    if (!booth_id) {
      return NextResponse.json(
        { error: 'booth_id is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(booth_id)) {
      return NextResponse.json(
        { error: 'Invalid booth_id format' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate review text length
    if (review_text && review_text.length > 5000) {
      return NextResponse.json(
        { error: 'Review text must be 5000 characters or less' },
        { status: 400 }
      );
    }

    // Validate photos array
    if (photos && (!Array.isArray(photos) || photos.length > 5)) {
      return NextResponse.json(
        { error: 'Maximum 5 photos allowed per review' },
        { status: 400 }
      );
    }

    // Validate anonymous name length
    if (anonymous_name && anonymous_name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (anonymous_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(anonymous_email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    const supabase = createServerClient();

    // Verify booth exists
    const { data: booth, error: boothError } = await supabase
      .from('booths')
      .select('id, name')
      .eq('id', booth_id)
      .single();

    if (boothError || !booth) {
      return NextResponse.json(
        { error: 'Booth not found' },
        { status: 404 }
      );
    }

    // Check for user authentication (optional)
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    // Rate limiting: Check if user/IP has submitted recently
    // For authenticated users, check by user_id
    // For anonymous users, we rely on frontend rate limiting
    if (userId) {
      const { data: recentReview, error: recentError } = await supabase
        .from('booth_reviews')
        .select('id, created_at')
        .eq('booth_id', booth_id)
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (!recentError && recentReview) {
        return NextResponse.json(
          { error: 'You can only submit one review per booth per day' },
          { status: 429 }
        );
      }
    }

    // Insert the review
    const { data: review, error: insertError } = await supabase
      .from('booth_reviews')
      .insert({
        booth_id,
        user_id: userId,
        rating,
        review_text: review_text?.trim() || null,
        photos: photos || [],
        anonymous_name: !userId ? anonymous_name?.trim() : null,
        anonymous_email: !userId ? anonymous_email?.trim() : null,
        status: 'pending', // All reviews start as pending
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting review:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully. It will be visible after moderation.',
      review: {
        id: review.id,
        booth_id: review.booth_id,
        rating: review.rating,
        status: review.status,
        created_at: review.created_at,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/reviews:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
