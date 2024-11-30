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

    // Prepare the messages array for the conversation
    const messages = [];

    // Always include the system message first
    messages.push({
      role: "system",
      content: settings?.system_prompt || "You are a horse racing expert analyst who maintains a great knowledge of horse racing."
    });

    // Add the race context as the first assistant message
    const raceContext = formatRaceContext(race);
    messages.push({
      role: "system",
      content: `Here is the race context you should use for your analysis:\n\n${raceContext}`
    });

    // Add previous conversation history if it exists
    if (conversationHistory?.length > 0) {
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.message
      })));
    }

    // Add the current user message
    messages.push({
      role: "user",
      content: message
    });

    console.log('Prepared messages for Claude:', {
      messageCount: messages.length,
      systemPromptLength: messages[0].content.length,
      contextLength: raceContext.length,
      historyLength: conversationHistory?.length || 0
    });

    // Make the API call to Claude
    const response = await anthropic.messages.create({
      model: settings?.anthropic_model || 'claude-3-sonnet-20240229',
      max_tokens: 1024,
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