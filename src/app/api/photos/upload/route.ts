import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const boothId = formData.get('boothId') as string;
    const photoType = formData.get('photoType') as string;
    const notes = formData.get('notes') as string | null;

    // Validate inputs
    if (!boothId) {
      return NextResponse.json(
        { error: 'Booth ID is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 files allowed per upload' },
        { status: 400 }
      );
    }

    // Validate files
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed: JPG, PNG, WEBP` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 5MB limit` },
          { status: 400 }
        );
      }
    }

    const supabase = createServerClient();

    // Check if booth exists
    const { data: booth, error: boothError } = await supabase
      .from('booths')
      .select('id')
      .eq('id', boothId)
      .single();

    if (boothError || !booth) {
      return NextResponse.json(
        { error: 'Booth not found' },
        { status: 404 }
      );
    }

    // Get current user (optional - can be anonymous)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    const uploadedPhotos = [];
    const errors = [];

    // Upload each file
    for (const file of files) {
      try {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `booth-${boothId}-${timestamp}-${random}.${extension}`;

        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('booth-community-photos')
          .upload(fileName, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          errors.push({ file: file.name, error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('booth-community-photos')
          .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
          errors.push({ file: file.name, error: 'Failed to get public URL' });
          continue;
        }

        // Insert record into database
        const { data: photoRecord, error: dbError } = await supabase
          .from('booth_photos')
          .insert({
            booth_id: boothId,
            user_id: userId,
            photo_url: urlData.publicUrl,
            photo_type: photoType || 'other',
            notes: notes || null,
            status: 'pending',
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          // Try to clean up the uploaded file
          await supabase.storage
            .from('booth-community-photos')
            .remove([fileName]);
          errors.push({ file: file.name, error: dbError.message });
          continue;
        }

        uploadedPhotos.push({
          id: photoRecord.id,
          url: urlData.publicUrl,
          fileName: file.name,
        });
      } catch (error) {
        console.error('Error processing file:', error);
        errors.push({
          file: file.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Return results
    if (uploadedPhotos.length === 0) {
      return NextResponse.json(
        {
          error: 'All uploads failed',
          details: errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedPhotos.length,
      total: files.length,
      photos: uploadedPhotos,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
