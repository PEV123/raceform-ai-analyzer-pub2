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

    const messageContent = [];
    
    // Handle new image upload
    const imageContent = processBase64Image(message);
    if (imageContent) {
      console.log('Processing new image from message');
      messageContent.push(imageContent);
      messageContent.push({
        type: "text",
        text: "Please analyze this image."
      });
    } else {
      // Only process race documents if no new image is being uploaded
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

    console.log('Making request to Anthropic API');
    
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