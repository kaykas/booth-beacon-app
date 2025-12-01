import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface BoothArtRequest {
  booth_id?: string;
  booth_ids?: string[];
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  description?: string;
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json();
    const { booth_id, booth_ids } = payload as BoothArtRequest;

    // Handle single or batch generation
    const idsToProcess = booth_ids || (booth_id ? [booth_id] : []);

    if (idsToProcess.length === 0) {
      return new Response(JSON.stringify({ error: 'booth_id or booth_ids required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const id of idsToProcess) {
      try {
        // Fetch booth data
        const { data: booth, error: boothError } = await supabase
          .from('booths')
          .select('*')
          .eq('id', id)
          .single();

        if (boothError || !booth) {
          results.push({ booth_id: id, error: 'Booth not found' });
          continue;
        }

        // Generate artistic prompt
        const prompt = generateArtisticPrompt(booth);

        console.log(`Generating art for booth: ${booth.name}`);
        console.log(`Prompt: ${prompt}`);

        // Call OpenAI DALL-E 3 API
        const imageUrl = await generateImageWithOpenAI(prompt, booth);

        // Update booth record
        const { error: updateError } = await supabase
          .from('booths')
          .update({
            ai_generated_image_url: imageUrl,
            ai_image_prompt: prompt,
            ai_image_generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (updateError) {
          results.push({ booth_id: id, error: updateError.message });
        } else {
          results.push({
            booth_id: id,
            success: true,
            image_url: imageUrl,
            prompt: prompt
          });
        }

      } catch (error) {
        results.push({ booth_id: id, error: error.message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

function generateArtisticPrompt(booth: any): string {
  const location = [booth.address, booth.city, booth.state, booth.country]
    .filter(Boolean)
    .join(', ');

  const basePrompt = `Artistic watercolor illustration of a vintage analog photo booth location at ${location}. `;

  const styleElements = [
    'Warm nostalgic lighting',
    'urban street photography aesthetic',
    'retro 1960s-1980s vibes',
    'film grain texture',
    'people walking by in the background',
    'authentic analog feel',
    'cozy neighborhood atmosphere'
  ];

  const contextualHints = [];

  if (booth.description) {
    contextualHints.push(booth.description);
  }

  if (booth.city?.toLowerCase().includes('new york')) {
    contextualHints.push('busy NYC street scene');
  } else if (booth.city?.toLowerCase().includes('berlin')) {
    contextualHints.push('artistic Berlin neighborhood');
  } else if (booth.city?.toLowerCase().includes('tokyo')) {
    contextualHints.push('neon-lit Japanese street');
  } else if (booth.city?.toLowerCase().includes('paris')) {
    contextualHints.push('charming Parisian street corner');
  } else if (booth.city?.toLowerCase().includes('london')) {
    contextualHints.push('classic London street scene');
  }

  const fullPrompt = `${basePrompt}${styleElements.join(', ')}${contextualHints.length > 0 ? ', ' + contextualHints.join(', ') : ''}. High quality, detailed, artistic rendering.`;

  return fullPrompt;
}

async function generateImageWithOpenAI(prompt: string, booth: any): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  // Call OpenAI DALL-E 3 API
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1792x1024', // 16:9 aspect ratio
      quality: 'standard',
      style: 'vivid' // For artistic interpretation
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  const generatedImageUrl = result.data[0].url;

  // Download the generated image
  const imageResponse = await fetch(generatedImageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download generated image: ${imageResponse.status}`);
  }

  const imageBlob = await imageResponse.blob();
  const imageBuffer = new Uint8Array(await imageBlob.arrayBuffer());

  // Upload to Supabase Storage
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const fileName = `booth-art/${booth.id}-${Date.now()}.png`;

  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('booth-images')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Upload error: ${uploadError.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('booth-images')
    .getPublicUrl(fileName);

  return publicUrl;
}

