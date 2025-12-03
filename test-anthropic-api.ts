/**
 * Quick test to verify Anthropic API access
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

async function testAPI() {
  console.log('Testing Anthropic API...\n');

  // Try current models
  const modelsToTest = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-latest',
    'claude-3-opus-20240229',
    'claude-3-haiku-20240307'
  ];

  for (const model of modelsToTest) {
    try {
      console.log(`Testing model: ${model}`);
      const message = await anthropic.messages.create({
        model,
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Hi'
        }]
      });

      console.log(`  ✅ SUCCESS! Model works.`);
      console.log(`  Response: ${JSON.stringify(message.content)}\n`);
      break; // Found a working model

    } catch (error: any) {
      console.log(`  ❌ FAILED: ${error.message}\n`);
    }
  }
}

testAPI().catch(console.error);
