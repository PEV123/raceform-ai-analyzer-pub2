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

    const messageContent = [];
    const isFirstMessage = !conversationHistory || conversationHistory.length === 0;
    
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
      // Only include race documents in first message to save on tokens
      if (isFirstMessage) {
        console.log('Processing race documents for first message');
        const validDocumentImages = await processRaceDocuments(
          race,
          Deno.env.get('SUPABASE_URL') || ''
        );
        messageContent.push(...validDocumentImages);
        console.log('Added document images:', validDocumentImages.length);
      }
      
      if (isFirstMessage) {
        // For first message, include comprehensive race context
        const raceContext = formatRaceContext(race);
        console.log('Including comprehensive race context in first message');
        const contextMessage = `[CONTEXT START]
Race Analysis Context:
${raceContext}

Raw Race Data:
${JSON.stringify(race, null, 2)}
[CONTEXT END]

User Question: ${message}`;

        messageContent.push({
          type: "text",
          text: contextMessage
        });

        // Log the full context being sent
        console.log('First message context:', {
          contextLength: contextMessage.length,
          estimatedTokens: Math.ceil(contextMessage.length / 4), // Rough estimation
          raceContextLength: raceContext.length,
          rawDataLength: JSON.stringify(race, null, 2).length,
          documentCount: validDocumentImages.length
        });
      } else {
        // For subsequent messages, just include the user's message
        messageContent.push({
          type: "text",
          text: message
        });
      }
    }

    console.log('Message content types:', messageContent.map(content => content.type));

    // Minimal system prompt - context is in first message
    const systemMessage = isFirstMessage ? 
      `You are a horse racing expert analyst. Use the provided race context to answer questions accurately and concisely. Format your responses clearly.` : 
      undefined;

    console.log('Making request to Anthropic API:', {
      model: settings.anthropic_model,
      isFirstMessage,
      hasSystemMessage: !!systemMessage,
      messageContentLength: messageContent.length,
      systemPromptLength: systemMessage?.length || 0,
      estimatedSystemTokens: systemMessage ? Math.ceil(systemMessage.length / 4) : 0
    });
    
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

    // Log the complete message payload
    console.log('Complete Claude message payload:', {
      model: settings.anthropic_model,
      systemMessage,
      messages: messages.map(msg => ({
        role: msg.role,
        contentTypes: Array.isArray(msg.content) 
          ? msg.content.map((c: any) => c.type)
          : typeof msg.content,
        textLength: Array.isArray(msg.content)
          ? msg.content.reduce((acc: number, c: any) => 
              acc + (c.type === 'text' ? c.text.length : 0), 0)
          : msg.content.length,
        estimatedTokens: Array.isArray(msg.content)
          ? Math.ceil(msg.content.reduce((acc: number, c: any) => 
              acc + (c.type === 'text' ? c.text.length : 0), 0) / 4)
          : Math.ceil(msg.content.length / 4)
      }))
    });
    
    const response = await anthropic.messages.create({
      model: settings.anthropic_model,
      max_tokens: 1024,
      system: systemMessage,
      messages
    });

    console.log('Received response from Anthropic:', {
      responseLength: response.content[0].text.length,
      estimatedResponseTokens: Math.ceil(response.content[0].text.length / 4)
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