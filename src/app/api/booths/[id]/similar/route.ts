import { NextRequest, NextResponse } from 'next/server';
import { getSimilarBooths } from '@/lib/recommendations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6', 10);

    const similarBooths = await getSimilarBooths(id, limit);

    return NextResponse.json(similarBooths);
  } catch (error) {
    console.error('Error in similar booths API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch similar booths' },
      { status: 500 }
    );
  }
}
