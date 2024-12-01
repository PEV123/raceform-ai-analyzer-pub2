import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.14.1";
import { corsHeaders, processBase64Image, fetchRaceData, fetchSettings, formatRaceContext } from "./utils.ts";
import { processRaceDocuments } from "./imageProcessing.ts";

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

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    });

    const raceContext = formatRaceContext(race);
    console.log('Generated race context length:', raceContext.length);

    const messages = [];

    // Process race documents
    const processedImages = await processRaceDocuments(race, Deno.env.get('SUPABASE_URL') || '');
    messages.push(...processedImages.map(img => ({
      role: "user",
      content: [img, { type: "text", text: "Please analyze this race document." }]
    })));

    // Add conversation history
    if (conversationHistory?.length > 0) {
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.message
      })));
    }

    // Process current message
    if (message.startsWith('data:image')) {
      const imageData = processBase64Image(message);
      if (imageData) {
        messages.push({
          role: "user",
          content: [imageData, { type: "text", text: "Please analyze this image." }]
        });
      }
    } else {
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

    const response = await anthropic.messages.create({
      model: settings?.anthropic_model || 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: `${settings?.system_prompt || "You are a horse racing expert analyst who maintains a great knowledge of horse racing."}\n\nRace Context:\n${raceContext}`,
      messages
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
      JSON.stringify({ error: true, message: error.message || 'An unexpected error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});