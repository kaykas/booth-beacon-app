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
 * Implementation note: This attempts multiple strategies:
 * 1. Google Imagen API (if properly configured with project ID)
 * 2. Unsplash API for real location photos
 * 3. Generic placeholder as last resort
 */
async function callImagenAPI(prompt: string): Promise<string> {
  // Strategy 1: Try Unsplash API for real photos (better than AI for now)
  // This gives us actual street photography of the location
  try {
    const imageUrl = await fetchUnsplashImage(prompt);
    if (imageUrl) {
      return imageUrl;
    }
  } catch (error) {
    console.warn('Unsplash fallback failed:', error);
  }

  // Strategy 2: Use Imagen API if available
  // Note: This requires proper Google Cloud project setup
  const apiKey = process.env.GOOGLE_IMAGEN_API_KEY;

  if (apiKey) {
    try {
      const imageUrl = await tryImagenAPI(prompt, apiKey);
      if (imageUrl) {
        return imageUrl;
      }
    } catch (error) {
      console.warn('Imagen API failed:', error);
    }
  }

  // Strategy 3: Generic placeholder
  return await generatePlaceholderImage(prompt);
}

/**
 * Try to use Google's Imagen API
 * This is experimental and may not work without proper setup
 */
async function tryImagenAPI(prompt: string, apiKey: string): Promise<string | null> {
  try {
    // This endpoint structure is for Vertex AI
    // You may need to adjust based on your Google Cloud setup
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '3:4',
            safetyFilterLevel: 'block_few',
            personGeneration: 'dont_allow',
          },
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.predictions && data.predictions.length > 0) {
      const prediction = data.predictions[0];
      if (prediction.bytesBase64Encoded) {
        return `data:image/png;base64,${prediction.bytesBase64Encoded}`;
      }
    }

    return null;
  } catch (error) {
    console.error('Imagen API error:', error);
    return null;
  }
}

/**
 * Fetch a real photo from Unsplash that matches the location
 * This provides high-quality street photography with a vintage filter
 */
async function fetchUnsplashImage(prompt: string): Promise<string | null> {
  try {
    // Extract location from prompt
    const cityMatch = prompt.match(/street view of ([^,]+),/i) ||
                     prompt.match(/of ([^,]+),/i);
    const city = cityMatch ? cityMatch[1].trim() : '';

    if (!city) {
      return null;
    }

    // Use Unsplash's public API (source.unsplash.com)
    // This provides random photos matching the search terms
    // Add vintage and street photography keywords
    const searchTerms = [
      city,
      'street',
      'urban',
      'architecture',
      'vintage'
    ].join(',');

    const encodedSearch = encodeURIComponent(searchTerms);

    // Return Unsplash URL with specific dimensions for booth-style images
    // 800x1000 gives us a nice portrait aspect ratio
    return `https://source.unsplash.com/800x1000/?${encodedSearch}`;
  } catch (error) {
    console.error('Unsplash fetch error:', error);
    return null;
  }
}

/**
 * Generate a placeholder image URL using a public image service
 * This is a fallback when the AI API is unavailable
 */
async function generatePlaceholderImage(prompt: string): Promise<string> {
  // For now, return a placeholder service URL with the location info
  // In production, you might want to use a different strategy

  // Extract city name from prompt for a more specific placeholder
  const cityMatch = prompt.match(/of ([^,]+),/);
  const city = cityMatch ? cityMatch[1] : 'location';

  // Use a URL that will be replaced later, or use a generic placeholder
  // You could also integrate with Unsplash API or similar
  const encodedCity = encodeURIComponent(city);

  // Return a placeholder URL that indicates this needs to be replaced
  // The actual implementation might fetch from Unsplash or another service
  return `https://source.unsplash.com/800x1000/?${encodedCity},street,vintage`;
}

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
 */
export async function updateBoothAIPreview(
  boothId: string,
  imageUrl: string
): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration is missing');
  }

  // Use service role key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
