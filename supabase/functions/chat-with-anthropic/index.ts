import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.14.1";
import { 
  corsHeaders, 
  processBase64Image,
  fetchRaceData, 
  fetchSettings,
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

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    });

    // Format the race context
    const raceContext = formatRaceContext(race);
    console.log('Generated race context length:', raceContext.length);

    // Prepare the messages array
    const messages = [];

    // Process any race documents and add them as image messages
    if (race.race_documents?.length) {
      console.log('Processing race documents for vision analysis');
      const imageDocuments = race.race_documents
        .filter(doc => doc.content_type?.startsWith('image/'));

      for (const doc of imageDocuments) {
        try {
          const imageUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/race_documents/${doc.file_path}`;
          const response = await fetch(imageUrl);
          if (!response.ok) {
            console.error('Failed to fetch image:', response.statusText);
            continue;
          }

          const arrayBuffer = await response.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          
          messages.push({
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: doc.content_type,
                  data: base64
                }
              },
              {
                type: "text",
                text: "Please analyze this race document."
              }
            ]
          });
        } catch (error) {
          console.error('Error processing document image:', error);
        }
      }
    }

    // Add previous conversation history
    if (conversationHistory?.length > 0) {
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.message
      })));
    }

    // Process current message
    if (message.startsWith('data:image')) {
      // Handle base64 image upload
      const imageData = processBase64Image(message);
      if (imageData) {
        messages.push({
          role: "user",
          content: [
            imageData,
            {
              type: "text",
              text: "Please analyze this image."
            }
          ]
        });
      }
    } else {
      // Regular text message
      messages.push({
        role: "user",
        content: message
      });
    }

    console.log('Making request to Anthropic API with:', {
      messageCount: messages.length,
      systemPromptLength: raceContext.length,
      historyLength: conversationHistory?.length || 0
    });

    // Make the API call to Claude
    const response = await anthropic.messages.create({
      model: settings?.anthropic_model || 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: `${settings?.system_prompt || "You are a horse racing expert analyst who maintains a great knowledge of horse racing."}\n\nRace Context:\n${raceContext}`,
      messages: messages
    });

    console.log('Received response from Claude:', {
      responseLength: response.content[0].text.length,
      estimatedTokens: Math.ceil(response.content[0].text.length / 4)
    });

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