import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.14.1";
import { 
  corsHeaders, 
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
    console.log('Received request:', { 
      raceId, 
      messageLength: message?.length,
      historyLength: conversationHistory?.length 
    });

    if (!message || !raceId) {
      throw new Error('Missing required parameters: message or raceId');
    }

    // Fetch race data and settings only if this is the first message
    const isFirstMessage = !conversationHistory || conversationHistory.length === 0;
    let systemMessages = [];
    
    if (isFirstMessage) {
      console.log('First message in conversation, fetching full context');
      const [race, settings] = await Promise.all([
        fetchRaceData(raceId),
        fetchSettings()
      ]);

      // Format race context
      const raceContext = formatRaceContext(race);
      console.log('Generated race context length:', raceContext.length);

      // Add system prompt and context only for the first message
      systemMessages = [
        {
          role: "system",
          content: settings?.system_prompt || "You are a horse racing expert analyst who maintains a great knowledge of horse racing."
        },
        {
          role: "system",
          content: `Here is the race context you should use for your analysis:\n\n${raceContext}`
        }
      ];
    } else {
      console.log('Continuing conversation, using existing context');
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    });

    // Prepare messages array
    const messages = [
      ...systemMessages,
      ...(conversationHistory?.map(msg => ({
        role: msg.role,
        content: msg.message
      })) || []),
      {
        role: "user",
        content: message
      }
    ];

    console.log('Sending request to Claude with:', {
      messageCount: messages.length,
      systemMessagesCount: systemMessages.length,
      historyLength: conversationHistory?.length || 0
    });

    // Make the API call to Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Using the most cost-effective model
      max_tokens: 1024,
      messages: messages,
      temperature: 0.7,
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