import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.14.1";
import { corsHeaders, fetchRaceData, fetchSettings, processRaceDocuments, formatRaceContext } from "./utils.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, raceId, conversationHistory, imageData } = await req.json();
    console.log('Received request with:', { 
      messageLength: message?.length,
      raceId,
      historyLength: conversationHistory?.length,
      hasImageData: !!imageData
    });

    if (!raceId) {
      throw new Error('Race ID is required');
    }

    if (imageData) {
      console.log('Image data received:', {
        type: imageData.type,
        dataLength: imageData.data?.length,
      });
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    });

    if (!anthropic.apiKey) {
      throw new Error('Anthropic API key is not configured');
    }

    const race = await fetchRaceData(raceId);
    if (!race) {
      throw new Error(`Race data not found for ID: ${raceId}`);
    }

    const settings = await fetchSettings();
    console.log('Fetched race data with runners:', race.runners?.length);

    const raceContext = formatRaceContext(race);
    console.log('Generated race context length:', raceContext.length);

    const messages = [];

    // Add race documents as images if they exist
    if (race.race_documents?.length) {
      try {
        console.log('Processing race documents:', race.race_documents.length);
        const processedImages = await processRaceDocuments(race, Deno.env.get('SUPABASE_URL') || '');
        console.log('Successfully processed race documents:', processedImages.length);
        messages.push(...processedImages.map(img => ({
          role: "user",
          content: [img, { type: "text", text: "Please analyze this race document." }]
        })));
      } catch (error) {
        console.error('Error processing race documents:', error);
        // Continue execution even if document processing fails
      }
    }

    // Add conversation history
    if (conversationHistory?.length > 0) {
      console.log('Adding conversation history:', conversationHistory.length, 'messages');
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.message
      })));
    }

    // Add current message with any uploaded image
    const currentContent = [];
    
    // Add any newly uploaded image from the chat
    if (imageData) {
      try {
        console.log('Processing new image upload with type:', imageData.type);
        currentContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: imageData.type,
            data: imageData.data
          }
        });
        console.log('Successfully added image to message content');
      } catch (error) {
        console.error('Error processing uploaded image:', error);
        // Continue execution even if image processing fails
      }
    }

    // Add the text message if it exists
    if (message) {
      currentContent.push({ type: "text", text: message });
    }
    
    if (currentContent.length > 0) {
      messages.push({
        role: "user",
        content: currentContent
      });
    }

    console.log('Making request to Anthropic API with:', {
      messageCount: messages.length,
      hasImages: imageData !== undefined,
      modelUsed: settings?.anthropic_model
    });

    const response = await anthropic.messages.create({
      model: settings?.anthropic_model || 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: `${settings?.system_prompt || "You are a horse racing expert analyst who maintains a great knowledge of horse racing."}\n\nRace Context:\n${raceContext}`,
      messages
    });

    console.log('Received response from Claude:', {
      responseLength: response.content[0].text.length,
      estimatedTokens: Math.ceil(response.content[0].text.length / 4),
      imagesIncluded: imageData ? 1 : 0
    });

    return new Response(
      JSON.stringify({ message: response.content[0].text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-with-anthropic function:', error);
    
    // Return a more detailed error response
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error.message || 'An unexpected error occurred',
        details: error.toString(),
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});