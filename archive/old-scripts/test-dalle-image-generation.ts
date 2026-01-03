/**
 * Test script for DALL-E 3 image generation
 * Run this to verify the OpenAI API integration is working
 *
 * Usage:
 *   npx tsx test-dalle-image-generation.ts
 */

import { generateLocationImage } from './src/lib/imageGeneration';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testImageGeneration() {
  console.log('='.repeat(60));
  console.log('Testing DALL-E 3 Image Generation');
  console.log('='.repeat(60));
  console.log('');

  // Check if API key is set
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY is not set in .env.local');
    console.log('');
    console.log('Please add your OpenAI API key to .env.local:');
    console.log('  OPENAI_API_KEY=sk-your-api-key-here');
    console.log('');
    console.log('Get your API key from: https://platform.openai.com/api-keys');
    process.exit(1);
  }

  console.log('✓ OPENAI_API_KEY is set');
  console.log(`  Key starts with: ${apiKey.substring(0, 10)}...`);
  console.log('');

  // Test data
  const testCases = [
    {
      name: 'Test 1: Paris street',
      options: {
        city: 'Paris',
        country: 'France',
        address: 'Champs-Élysées',
        boothName: 'Photomaton Paris'
      }
    },
    {
      name: 'Test 2: New York without address',
      options: {
        city: 'New York',
        country: 'USA',
        boothName: 'Times Square Booth'
      }
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${testCase.name}`);
    console.log('='.repeat(60));
    console.log('Options:', JSON.stringify(testCase.options, null, 2));
    console.log('');

    try {
      console.log('🎨 Generating image...');
      const startTime = Date.now();

      const result = await generateLocationImage(testCase.options);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (result.success && result.imageUrl) {
        console.log('✅ Image generation successful!');
        console.log(`   Duration: ${duration}s`);
        console.log(`   Image URL: ${result.imageUrl}`);
        console.log('');

        // Check if it's a placeholder or real image
        if (result.imageUrl.includes('placeholder')) {
          console.log('⚠️  Note: This is a placeholder image');
          console.log('   The DALL-E 3 API may have failed or API key may be invalid');
        } else if (result.imageUrl.startsWith('http')) {
          console.log('🎉 Real AI-generated image from DALL-E 3!');
          console.log('   You can open this URL in your browser to view the image');
        } else if (result.imageUrl.startsWith('data:')) {
          console.log('🎉 Real AI-generated image (data URL)');
          console.log(`   Image size: ${(result.imageUrl.length / 1024).toFixed(2)} KB`);
        }
      } else {
        console.log('❌ Image generation failed');
        console.log(`   Error: ${result.error || 'Unknown error'}`);
      }

      // Wait a bit between requests to avoid rate limits
      if (i < testCases.length - 1) {
        console.log('\n⏳ Waiting 2 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.log('❌ Test failed with exception');
      console.error('   Error:', error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Testing Complete');
  console.log('='.repeat(60));
  console.log('');
  console.log('Next steps:');
  console.log('1. If tests passed: Deploy to production with OPENAI_API_KEY set');
  console.log('2. If tests failed: Check API key and review error messages');
  console.log('3. Test in your app by opening a booth popup without a photo');
  console.log('');
}

// Run the test
testImageGeneration()
  .then(() => {
    console.log('✓ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
