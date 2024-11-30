import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.14.1";
import { 
  corsHeaders, 
  processBase64Image, 
  fetchRaceData, 
  fetchSettings,
  processRaceDocuments,
  formatRaceContext 
} from "./utils.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, raceId, conversationHistory } = await req.json();
    console.log('Received request:', { raceId, messageType: typeof message, historyLength: conversationHistory?.length });

    if (!message || !raceId) {
      throw new Error('Missing required parameters: message or raceId');
    }

    const race = await fetchRaceData(raceId);
    const settings = await fetchSettings();
    console.log('Fetched race data with runners:', race.runners?.length);

    // Redirect to OpenAI function if selected
    if (settings.selected_provider === 'openai') {
      console.log('Redirecting to OpenAI function');
      const response = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/chat-with-openai`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, raceId, conversationHistory }),
        }
      );

      const data = await response.json();
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          media_type: "image/png",
          data: await fetchAndConvertToBase64(imageUrl)
        }
      });
      
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
      console.log('Adding race document images to message');
      const validDocumentImages = await processRaceDocuments(
        race,
        Deno.env.get('SUPABASE_URL') || ''
      );
      messageContent.push(...validDocumentImages);
      
      // For the first message, include the race context
      if (!conversationHistory || conversationHistory.length === 0) {
        const raceContext = formatRaceContext(race);
        console.log('Including race context in first message');
        messageContent.push({
          type: "text",
          text: `Race Context:\n${raceContext}\n\nUser Question: ${message}`
        });
      } else {
        messageContent.push({
          type: "text",
          text: message
        });
      }
    }

    console.log('Message content types:', messageContent.map(content => content.type));

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });
    
    // Prepare system message
    const systemMessage = `
      ${settings?.system_prompt || 'You are a horse racing expert analyst who maintains a great knowledge of horse racing.'}
      ${settings?.knowledge_base || ''}
      
      Raw Race Data for Reference:
      ${JSON.stringify(race, null, 2)}
    `;

    console.log('Making request to Anthropic API with model:', settings.anthropic_model);
    console.log('Is first message:', !conversationHistory || conversationHistory.length === 0);
    
    // Convert conversation history to Anthropic format
    const messages = conversationHistory ? [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.message
      })),
      {
        role: "user",
        content: messageContent
      }
    ] : [{
      role: "user",
      content: messageContent
    }];

    console.log('Sending messages to Anthropic:', messages.length);
    
    const response = await anthropic.messages.create({
      model: settings.anthropic_model,
      max_tokens: 1024,
      system: systemMessage,
      messages
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