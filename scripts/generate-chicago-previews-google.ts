#!/usr/bin/env tsx

/**
 * Generate AI preview images for Chicago booths using Google Imagen API
 * Uses Google's imagen-3.0-generate-001 model via Vertex AI
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GOOGLE_API_KEY = process.env.GOOGLE_IMAGEN_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GOOGLE_API_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Chicago booths without images
const CHICAGO_BOOTHS = [
  'schubas-chicago-1',
  'reckless-records-chicago-1',
  'quimby-s-bookstore-chicago-1',
  'sheffield-s-chicago-1',
  'charleston-chicago'
];

interface Booth {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
}

/**
 * Generate image using Google Imagen via Vertex AI REST API
 */
async function generateImageWithGoogle(prompt: string): Promise<Buffer> {
  console.log('  📡 Calling Google Imagen API...');

  // Google Vertex AI Imagen endpoint
  const PROJECT_ID = 'booth-beacon'; // You may need to adjust this
  const LOCATION = 'us-central1';
  const MODEL = 'imagen-3.0-generate-001';

  // Try using the generative language API with the API key
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateImages?key=${GOOGLE_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      numberOfImages: 1,
      aspectRatio: '16:9',
      safetyFilterLevel: 'BLOCK_ONLY_HIGH',
      personGeneration: 'DONT_ALLOW'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Google API Error:', errorText);
    throw new Error(`Google Imagen API error: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json();

  // Extract base64 image from response
  if (data.generatedImages && data.generatedImages.length > 0) {
    const imageData = data.generatedImages[0];

    // Check if it's base64 encoded
    if (imageData.bytesBase64Encoded) {
      return Buffer.from(imageData.bytesBase64Encoded, 'base64');
    }

    // Or if it's a URL
    if (imageData.imageUri) {
      const imageResponse = await fetch(imageData.imageUri);
      const arrayBuffer = await imageResponse.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  }

  throw new Error('No image data in Google API response');
}

/**
 * Alternative: Use Google's AI Studio API (simpler, uses API key)
 */
async function generateImageWithAIStudio(prompt: string): Promise<Buffer> {
  console.log('  📡 Trying Google AI Studio API...');

  // This is a simplified approach - Google's generative AI might not support image generation yet
  // Let's try the Vertex AI approach with proper authentication

  throw new Error('Google AI Studio does not support image generation yet. Please configure Vertex AI with service account.');
}

/**
 * Fallback: Use a free alternative like Hugging Face Stable Diffusion
 */
async function generateImageWithHuggingFace(prompt: string): Promise<Buffer> {
  console.log('  📡 Using Hugging Face Stable Diffusion...');

  const HF_API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';

  // Note: This requires a Hugging Face API token
  // For now, let's create a placeholder
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`, // If you have one
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        width: 1024,
        height: 576,
        num_inference_steps: 30
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Create a simple placeholder image with booth info
 */
async function createPlaceholderImage(booth: Booth): Promise<Buffer> {
  console.log('  🎨 Creating local placeholder image...');

  // For now, return a simple SVG as a buffer
  const svg = `
    <svg width="1024" height="576" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f59e0b"/>
      <text x="50%" y="40%" font-family="Arial" font-size="48" fill="white" text-anchor="middle" font-weight="bold">
        ${booth.name}
      </text>
      <text x="50%" y="55%" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
        ${booth.address}
      </text>
      <text x="50%" y="65%" font-family="Arial" font-size="20" fill="white" text-anchor="middle">
        ${booth.city}, ${booth.state || booth.country}
      </text>
      <text x="50%" y="80%" font-family="Arial" font-size="16" fill="#fed7aa" text-anchor="middle">
        Classic Analog Photo Booth
      </text>
    </svg>
  `;

  return Buffer.from(svg);
}

/**
 * Generate prompt for booth image
 */
function generatePrompt(booth: Booth): string {
  return `A realistic photo of a vintage analog photo booth at ${booth.name}, located at ${booth.address} in ${booth.city}. The image shows a classic automated photobooth machine, similar to a Photomaton or Photo-Me booth from the 1970s-1990s. The booth has a curtained entrance and is situated in an indoor setting. The style is photographic, capturing the nostalgic aesthetic of analog photography. No people visible, focus on the booth itself. Warm, inviting lighting.`;
}

/**
 * Upload image to Supabase Storage
 */
async function uploadToStorage(
  imageBuffer: Buffer,
  boothId: string,
  fileExtension: string = 'png'
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `booth-${boothId}-ai-preview-${timestamp}.${fileExtension}`;
  const filePath = `ai-previews/${fileName}`;

  console.log(`  📤 Uploading to storage: ${filePath}`);

  const { data, error } = await supabase.storage
    .from('booth-images')
    .upload(filePath, imageBuffer, {
      contentType: `image/${fileExtension}`,
      upsert: false
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('booth-images')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Update booth record with AI preview URL
 */
async function updateBoothRecord(boothId: string, imageUrl: string): Promise<void> {
  console.log('  💾 Updating booth record...');

  const { error } = await supabase
    .from('booths')
    .update({
      ai_preview_url: imageUrl,
      ai_preview_generated_at: new Date().toISOString()
    })
    .eq('id', boothId);

  if (error) {
    throw new Error(`Database update failed: ${error.message}`);
  }
}

/**
 * Process a single booth
 */
async function processBooths(booth: Booth): Promise<void> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🏢 Processing: ${booth.name}`);
  console.log(`   Slug: ${booth.slug}`);
  console.log(`   Location: ${booth.address}, ${booth.city}`);
  console.log(`${'='.repeat(70)}`);

  try {
    // Generate prompt
    const prompt = generatePrompt(booth);
    console.log(`  💬 Prompt: ${prompt.substring(0, 100)}...`);

    // Try to generate image (with fallbacks)
    let imageBuffer: Buffer;
    let fileExtension = 'png';

    try {
      // Try Google Imagen first
      imageBuffer = await generateImageWithGoogle(prompt);
      console.log('  ✅ Generated with Google Imagen');
    } catch (googleError) {
      console.log(`  ⚠️  Google Imagen failed: ${googleError}`);

      try {
        // Try Hugging Face as fallback
        imageBuffer = await generateImageWithHuggingFace(prompt);
        console.log('  ✅ Generated with Hugging Face');
      } catch (hfError) {
        console.log(`  ⚠️  Hugging Face failed: ${hfError}`);

        // Use local placeholder as last resort
        imageBuffer = await createPlaceholderImage(booth);
        fileExtension = 'svg';
        console.log('  ✅ Created local placeholder');
      }
    }

    // Upload to storage
    const imageUrl = await uploadToStorage(imageBuffer, booth.id, fileExtension);
    console.log(`  ✅ Uploaded: ${imageUrl}`);

    // Update database
    await updateBoothRecord(booth.id, imageUrl);
    console.log(`  ✅ Database updated`);

    console.log(`\n✅ SUCCESS: ${booth.name}`);
  } catch (error) {
    console.error(`\n❌ FAILED: ${booth.name}`);
    console.error(`   Error: ${error}`);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🎨 Google Imagen Chicago Booth Preview Generator\n');
  console.log(`📊 Target: ${CHICAGO_BOOTHS.length} booths\n`);

  // Fetch booth data
  console.log('📥 Fetching booth data from database...\n');

  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, slug, address, city, state, country')
    .in('slug', CHICAGO_BOOTHS);

  if (error) {
    console.error('❌ Database fetch failed:', error);
    process.exit(1);
  }

  if (!booths || booths.length === 0) {
    console.error('❌ No booths found with specified slugs');
    process.exit(1);
  }

  console.log(`✅ Found ${booths.length} booths\n`);

  // Process each booth
  let successCount = 0;
  let failureCount = 0;

  for (const booth of booths) {
    try {
      await processBooths(booth as Booth);
      successCount++;

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      failureCount++;
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Successful: ${successCount}/${booths.length}`);
  console.log(`❌ Failed: ${failureCount}/${booths.length}`);
  console.log('='.repeat(70) + '\n');

  if (failureCount > 0) {
    process.exit(1);
  }
}

// Run
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
