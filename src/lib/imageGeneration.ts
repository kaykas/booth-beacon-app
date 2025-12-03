/**
 * Image Generation Service
 * Generates AI images for photo booth locations using OpenAI DALL-E 3
 * Creates vintage photo booth strip style images of the location
 */

interface GenerateImageOptions {
  city: string;
  country: string;
  address?: string;
  boothName?: string;
}

interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Generate a vintage photo booth strip style image of a location
 * using OpenAI DALL-E 3
 */
export async function generateLocationImage(
  options: GenerateImageOptions
): Promise<ImageGenerationResult> {
  const { city, country, address, boothName } = options;

  try {
    // Construct a prompt for the location image
    // Style: vintage photo booth strip aesthetic
    // Content: street view of the location (NOT the booth itself)
    const prompt = constructLocationPrompt(city, country, address, boothName);

    console.log('Generating AI image with prompt:', prompt);

    // Call OpenAI DALL-E 3 API
    const imageUrl = await callDallEAPI(prompt);

    return {
      success: true,
      imageUrl,
    };
  } catch (error) {
    console.error('Error generating location image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Construct a prompt for generating a location image
 * with vintage photo booth strip aesthetic
 */
function constructLocationPrompt(
  city: string,
  country: string,
  address?: string,
  _boothName?: string
): string {
  // Create a descriptive prompt that focuses on the location
  // NOT the photo booth itself
  let locationDescription = '';

  if (address) {
    locationDescription = `street view of ${address}, ${city}, ${country}`;
  } else {
    locationDescription = `iconic street view of ${city}, ${country}`;
  }

  // Style directive: vintage photo booth strip aesthetic
  const styleDirective = `
    Style: Vintage photo booth strip aesthetic.
    The image should have a warm, slightly faded nostalgic look,
    similar to old film photography from the 1960s-1980s.
    Soft edges, slight vignetting, and warm color tones.
    This is a LOCATION VIEW, not a photo booth machine.
  `.trim();

  // Combine into final prompt
  return `${locationDescription}. ${styleDirective}`;
}

/**
 * Call an AI image generation API to create an image
 * Returns the URL or data URL of the generated image
 *
 * Strategy:
 * 1. OpenAI DALL-E 3 (Primary)
 * 2. Generic placeholder (Fallback)
 */
async function callDallEAPI(prompt: string): Promise<string> {
  // Strategy 1: Use DALL-E 3 if available (Primary)
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      console.log('Attempting to generate image with OpenAI DALL-E 3...');
      const imageUrl = await tryDallEAPI(prompt, apiKey);
      if (imageUrl) {
        return imageUrl;
      }
    } catch (error) {
      console.warn('DALL-E 3 API failed:', error);
    }
  } else {
    console.warn('OPENAI_API_KEY is not set. Skipping AI generation.');
  }

  // Strategy 2: Generic placeholder
  console.log('Falling back to placeholder image.');
  return generatePlaceholderImage();
}

/**
 * Try to use OpenAI's DALL-E 3 API
 */
async function tryDallEAPI(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const { default: OpenAI } = await import('openai');

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    console.log('Calling DALL-E 3 with prompt:', prompt);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      console.error('DALL-E 3 API returned no image URL');
      return null;
    }

    console.log('DALL-E 3 successfully generated image');
    return imageUrl;
  } catch (error) {
    console.error('DALL-E 3 API exception:', error);
    return null;
  }
}

/**
 * Generate a placeholder image URL
 * Returns a reliable local static asset
 */
function generatePlaceholderImage(): string {
  // Return the local SVG placeholder which is reliable
  return '/placeholder-booth.svg';
}

// Removed fetchUnsplashImage as the API is deprecated

/**
 * Upload a generated image to Supabase storage
 * Returns the public URL of the uploaded image
 */
export async function uploadGeneratedImage(
  imageDataUrl: string,
  boothId: string
): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Convert data URL to blob
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();

  // Generate a unique filename
  const fileName = `booth-${boothId}-ai-preview-${Date.now()}.png`;
  const filePath = `ai-previews/${fileName}`;

  // Upload to Supabase storage
  const { error } = await supabase.storage
    .from('booth-images')
    .upload(filePath, blob, {
      contentType: 'image/png',
      cacheControl: '31536000', // 1 year
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image to Supabase: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('booth-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Update booth record with the generated AI preview URL
 * Uses anon key since AI preview updates should be allowed through RLS policies
 */
export async function updateBoothAIPreview(
  boothId: string,
  imageUrl: string
): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing');
  }

  // Use anon key with RLS policies
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { error } = await supabase
    .from('booths')
    .update({
      ai_preview_url: imageUrl,
      ai_preview_generated_at: new Date().toISOString(),
    })
    .eq('id', boothId);

  if (error) {
    throw new Error(`Failed to update booth: ${error.message}`);
  }
}
