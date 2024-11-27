import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const documentImages = await Promise.all(race.race_documents
      .filter((doc: any) => doc.content_type.startsWith('image/'))
      .map(async (doc: any) => {
        const url = `https://vlcrqrmqghskrdhhsgqt.supabase.co/storage/v1/object/public/race_documents/${doc.file_path}`;
        try {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
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

    // Filter out any failed image processing
    const validDocumentImages = documentImages.filter(img => img !== null);

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

    // Check if the message contains a base64 image
    const messageContent = [];
    
    // First add any document images
    messageContent.push(...validDocumentImages);
    
    // Then add the user's message
    if (message.startsWith('data:image')) {
      // Handle base64 image from user
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
        messages: [{
          role: 'user',
          content: messageContent
        }],
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