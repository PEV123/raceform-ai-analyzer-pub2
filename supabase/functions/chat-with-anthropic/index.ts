import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, raceId } = await req.json();
    console.log('Received request:', { raceId, message });

    if (!message || !raceId) {
      throw new Error('Missing required parameters: message or raceId');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Fetching race data...');
    const { data: race, error: raceError } = await supabase
      .from('races')
      .select(`
        *,
        runners (*),
        race_documents (*)
      `)
      .eq('id', raceId)
      .single();

    if (raceError) {
      console.error('Error fetching race data:', raceError);
      throw raceError;
    }

    console.log('Fetching admin settings...');
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('*')
      .single();

    const formattedRunners = race.runners.map((runner: any) => `
      ${runner.number}. ${runner.horse} (Draw: ${runner.draw})
      - Jockey: ${runner.jockey}
      - Trainer: ${runner.trainer}
      - Form: ${runner.form || 'No form'}
      - Weight: ${runner.lbs}lbs
      - Breeding: By ${runner.sire} (${runner.sire_region}) out of ${runner.dam} (${runner.dam_region})
      ${runner.headgear ? `- Headgear: ${runner.headgear}` : ''}
      ${runner.ofr ? `- Official Rating: ${runner.ofr}` : ''}
      ${runner.ts ? `- Top Speed Rating: ${runner.ts}` : ''}
    `).join('\n');

    // Process race documents and handle images
    console.log('Processing race documents...');
    const documentDescriptions = await Promise.all(race.race_documents.map(async (doc: any) => {
      const url = `https://vlcrqrmqghskrdhhsgqt.supabase.co/storage/v1/object/public/race_documents/${doc.file_path}`;
      
      // For image files, include them directly in the message
      if (doc.content_type.startsWith('image/')) {
        return `Race document: ${doc.file_name} (${doc.content_type})
URL: ${url}

Please analyze this image as part of your response.`;
      } else {
        return `Race document: ${doc.file_name} (${doc.content_type})
URL: ${url}`;
      }
    }));

    // Check if the message contains an image URL
    const imageUrlMatch = message.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i);
    let processedMessage = message;
    
    if (imageUrlMatch) {
      console.log('Found image URL in message:', imageUrlMatch[0]);
      processedMessage = `${message}

Please analyze this image as part of your response.`;
    }

    const systemMessage = `
      ${settings?.system_prompt || 'You are a horse racing expert analyst who maintains a great knowledge of horse racing.'}

      ${settings?.knowledge_base || ''}

      Race Analysis Context:
      Race: ${race.race_name} at ${race.course}
      Time: ${race.off_time}
      Class: ${race.race_class}
      Age Band: ${race.age_band}
      Rating Band: ${race.rating_band}
      Prize: ${race.prize}
      Field Size: ${race.field_size} runners

      Detailed Runner Information:
      ${formattedRunners}

      Race Documents:
      ${documentDescriptions.join('\n\n') || 'No race documents have been uploaded for this race.'}

      Please provide detailed analysis based on this information. If images are shared in the conversation, please analyze them and incorporate your findings into your response.
    `;

    console.log('Making request to Anthropic API');
    console.log('System message length:', systemMessage.length);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        system: systemMessage,
        messages: [{ role: 'user', content: processedMessage }],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from Anthropic');

    return new Response(
      JSON.stringify({ message: data.content[0].text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat-with-anthropic function:', error);
    return new Response(
      JSON.stringify({ 
        error: true,
        message: error.message || 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});