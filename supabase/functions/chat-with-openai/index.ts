import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders, 
  processBase64Image, 
  fetchRaceData, 
  fetchSettings,
  processRaceDocuments,
  formatRaceContext 
} from "../chat-with-anthropic/utils.ts";

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

    const messageContent = [];
    
    // Check if the message contains an image URL from a new upload
    if (message.includes('storage/v1/object/public/race_documents/chat-images/')) {
      console.log('Processing new uploaded image URL');
      const lines = message.split('\n');
      const imageUrl = lines[0];
      
      // Add image as base64 for OpenAI vision API
      messageContent.push({
        type: "image",
        image_url: {
          url: imageUrl
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
      // Process any existing race documents
      const validDocumentImages = await processRaceDocuments(
        race,
        Deno.env.get('SUPABASE_URL') || ''
      );
      
      // Convert document images to OpenAI format
      for (const image of validDocumentImages) {
        if (image?.source?.data) {
          messageContent.push({
            type: "image",
            image_url: {
              url: `data:${image.source.media_type};base64,${image.source.data}`
            }
          });
        }
      }
      
      messageContent.push({
        type: "text",
        text: message
      });
    }

    console.log('Message content types:', messageContent.map(content => content.type));

    const raceContext = formatRaceContext(race);
    console.log('Generated race context length:', raceContext.length);
    
    const systemMessage = `
      ${settings?.system_prompt || 'You are a horse racing expert analyst who maintains a great knowledge of horse racing.'}
      ${settings?.knowledge_base || ''}
      
      Race Analysis Context:
      ${raceContext}

      Raw Race Data for Reference:
      ${JSON.stringify(race, null, 2)}
    `;

    console.log('Making request to OpenAI API with model:', settings.openai_model);
    
    // Convert conversation history to OpenAI format
    const messages = [
      { 
        role: "system", 
        content: systemMessage
      },
      ...(conversationHistory?.map(msg => ({
        role: msg.role,
        content: msg.message
      })) || []),
      { 
        role: "user", 
        content: messageContent
      }
    ];

    console.log('Sending messages to OpenAI:', messages.length);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.openai_model,
        messages,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'Failed to get response from OpenAI');
    }

    const data = await response.json();
    console.log('Received response from OpenAI');
    
    return new Response(
      JSON.stringify({ message: data.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-with-openai function:', error);
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