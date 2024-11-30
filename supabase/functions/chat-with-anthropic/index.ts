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

    // Initialize Anthropic client with API key
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    });

    // Format the race context
    const raceContext = formatRaceContext(race);
    console.log('Generated race context length:', raceContext.length);

    // Prepare the messages array for the conversation
    const messages = [];

    // Add the system context as a system message
    const systemPrompt = `${settings?.system_prompt || "You are a horse racing expert analyst who maintains a great knowledge of horse racing."}\n\nRace Context:\n${raceContext}`;
    
    // Process any race documents and add them as image messages
    if (race.race_documents?.length) {
      console.log('Processing race documents for vision analysis');
      const imageUrls = race.race_documents
        .filter(doc => doc.content_type?.startsWith('image/'))
        .map(doc => `https://vlcrqrmqghskrdhhsgqt.supabase.co/storage/v1/object/public/race_documents/${doc.file_path}`);
      
      // Add images as separate messages with content arrays
      for (const url of imageUrls) {
        messages.push({
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url
              }
            },
            {
              type: "text",
              text: "Please analyze this race document."
            }
          ]
        });
      }
    }

    // Add previous conversation history if it exists
    if (conversationHistory?.length > 0) {
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.message
      })));
    }

    // Check if current message contains an image URL
    if (message.startsWith('https://') && message.includes('/storage/v1/object/public/race_documents/')) {
      // Handle new image upload
      const messageLines = message.split('\n');
      const imageUrl = messageLines[0];
      const textContent = messageLines.slice(1).join('\n') || "Please analyze this image.";
      
      messages.push({
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "url",
              url: imageUrl
            }
          },
          {
            type: "text",
            text: textContent
          }
        ]
      });
    } else {
      // Regular text message
      messages.push({
        role: "user",
        content: message
      });
    }

    console.log('Making request to Anthropic API with:', {
      messageCount: messages.length,
      systemPromptLength: systemPrompt.length,
      historyLength: conversationHistory?.length || 0
    });

    // Make the API call to Claude
    const response = await anthropic.messages.create({
      model: settings?.anthropic_model || 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: systemPrompt,
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