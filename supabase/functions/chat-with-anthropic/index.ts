import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.14.1";

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
    console.log('Received request:', { raceId, messageType: typeof message });

    if (!message || !raceId) {
      throw new Error('Missing required parameters: message or raceId');
    }

    // Initialize Supabase client with proper error handling
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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

    console.log('Processing race documents...');
    console.log('Number of documents:', race.race_documents?.length);
    
    const documentImages = await Promise.all((race.race_documents || [])
      .filter((doc: any) => doc.content_type?.startsWith('image/'))
      .map(async (doc: any) => {
        const url = `${supabaseUrl}/storage/v1/object/public/race_documents/${doc.file_path}`;
        console.log('Processing document URL:', url);
        
        try {
          const response = await fetch(url);
          if (!response.ok) {
            console.error('Failed to fetch image:', response.statusText);
            return null;
          }
          
          // Read the response as an ArrayBuffer
          const arrayBuffer = await response.arrayBuffer();
          // Convert ArrayBuffer to Uint8Array
          const uint8Array = new Uint8Array(arrayBuffer);
          // Convert to base64 in chunks to avoid stack overflow
          const chunkSize = 32768; // Process 32KB at a time
          let binary = '';
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
          }
          const base64 = btoa(binary);
          
          console.log('Successfully processed image to base64');
          
          return {
            type: "image",
            source: {
              type: "base64",
              media_type: doc.content_type,
              data: base64
            }
          };
        } catch (error) {
          console.error('Error processing image:', error);
          return null;
        }
      }));

    const validDocumentImages = documentImages.filter(img => img !== null);
    console.log('Number of valid processed images:', validDocumentImages.length);

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

      Please provide detailed analysis based on this information and any images shared. Analyze all images thoroughly and incorporate your findings into your response.
    `;

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('Missing Anthropic API key');
    }

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    const messageContent = [];
    
    // Add race document images first
    if (validDocumentImages.length > 0) {
      console.log('Adding race document images to message');
      messageContent.push(...validDocumentImages);
    }
    
    // Then handle any new image being sent in the message
    if (message.startsWith('data:image')) {
      console.log('Processing new image from message');
      const [header, base64Data] = message.split(',');
      const mediaType = header.split(';')[0].split(':')[1];
      messageContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: base64Data
        }
      });
      messageContent.push({
        type: "text",
        text: "Please analyze this image."
      });
    } else {
      messageContent.push({
        type: "text",
        text: message
      });
    }

    console.log('Making request to Anthropic API');
    console.log('Message content types:', messageContent.map(content => content.type));
    
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      system: systemMessage,
      messages: [{
        role: "user",
        content: messageContent
      }]
    });

    console.log('Received response from Anthropic');
    
    return new Response(
      JSON.stringify({ message: response.content[0].text }),
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