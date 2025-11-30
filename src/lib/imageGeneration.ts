/**
 * Image Generation Service
 * Generates AI images for photo booth locations using Google's Imagen API
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
 * using Google's Imagen API
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

    // Call Google's Imagen API
    const imageUrl = await callImagenAPI(prompt);

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
  boothName?: string
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
 * 1. Google Imagen API (Primary)
 * 2. Generic placeholder (Fallback)
 */
async function callImagenAPI(prompt: string): Promise<string> {
  // Strategy 1: Use Imagen API if available (Primary)
  const apiKey = process.env.GOOGLE_IMAGEN_API_KEY;

  if (apiKey) {
    try {
      console.log('Attempting to generate image with Google Imagen...');
      const imageUrl = await tryImagenAPI(prompt, apiKey);
      if (imageUrl) {
        return imageUrl;
      }
    } catch (error) {
      console.warn('Imagen API failed:', error);
    }
  } else {
    console.warn('GOOGLE_IMAGEN_API_KEY is not set. Skipping AI generation.');
  }

  // Strategy 2: Generic placeholder
  console.log('Falling back to placeholder image.');
  return generatePlaceholderImage();
}

/**
 * Try to use Google's Imagen API
 */
async function tryImagenAPI(prompt: string, apiKey: string): Promise<string | null> {
  try {
    // Using the Gemini API endpoint for image generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/image-generation-001:generate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: { text: prompt },
          sampleCount: 1,
          aspectRatio: '3:4', // Portrait for booth strips
          safetyConfig: {
            safetyFilterLevel: 'BLOCK_ONLY_HIGH'
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Imagen API error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();

    // Check for standard Gemini Image Generation response structure
    if (data.images && data.images.length > 0) {
      const image = data.images[0];
      if (image.imageBytes) {
        return `data:image/png;base64,${image.imageBytes}`;
      }
    }
    
    // Fallback check for older/Vertex format (just in case)
    if (data.predictions && data.predictions.length > 0) {
      const prediction = data.predictions[0];
      if (prediction.bytesBase64Encoded) {
        return `data:image/png;base64,${prediction.bytesBase64Encoded}`;
      }
    }

    return null;
  } catch (error) {
    console.error('Imagen API exception:', error);
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
  const { data, error } = await supabase.storage
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
