import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.14.1";
import { 
  corsHeaders, 
  processBase64Image, 
  fetchRaceData, 
  fetchSettings,
  processRaceDocuments 
} from "./utils.ts";

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

    const race = await fetchRaceData(raceId);
    const settings = await fetchSettings();

    if (settings.selected_provider === 'openai') {
      return new Response(
        JSON.stringify({ 
          error: true,
          message: 'OpenAI integration is not yet implemented'
        }),
        {
          status: 501,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const messageContent = [];
    
    // Check if the message contains an image URL from a new upload
    if (message.includes('storage/v1/object/public/race_documents/chat-images/')) {
      console.log('Processing new uploaded image URL');
      const lines = message.split('\n');
      const imageUrl = lines[0];
      messageContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png", // Default to PNG, the API will handle other formats
          data: await fetchAndConvertToBase64(imageUrl)
        }
      });
      
      // Add any text message that follows the image URL
      if (lines.length > 1) {
        messageContent.push({
          type: "text",
          text: lines.slice(1).join('\n')
        });
      } else {
        messageContent.push({
          type: "text",
          text: "Please analyze this image."
        });
      }
    } else {
      // Handle regular text messages with race documents
      console.log('Adding race document images to message');
      const validDocumentImages = await processRaceDocuments(
        race,
        Deno.env.get('SUPABASE_URL') || ''
      );
      messageContent.push(...validDocumentImages);
      messageContent.push({
        type: "text",
        text: message
      });
    }

    console.log('Message content types:', messageContent.map(content => content.type));

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });
    
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
    `;

    console.log('Making request to Anthropic API with model:', settings.anthropic_model);
    
    const response = await anthropic.messages.create({
      model: settings.anthropic_model,
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

// Helper function to fetch and convert image to base64
async function fetchAndConvertToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 32768;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}