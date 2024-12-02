import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.14.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders, processRaceDocuments, formatRaceContext } from "./utils.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, raceId, conversationHistory, imageData } = await req.json();
    console.log('Received request:', { 
      messageLength: message?.length,
      raceId,
      historyLength: conversationHistory?.length,
      hasImageData: !!imageData
    });

    if (!raceId) {
      throw new Error('Race ID is required');
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
      headers: {
        'anthropic-beta': 'pdfs-2024-09-25'  // Adding PDF support header
      }
    });

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch race data
    const { data: race, error: raceError } = await supabase
      .from('races')
      .select(`
        *,
        runners (*),
        race_documents (*)
      `)
      .eq('id', raceId)
      .single();

    if (raceError) {
      console.error('Error fetching race:', raceError);
      throw raceError;
    }

    if (!race) {
      throw new Error('Race not found');
    }

    const { data: settings } = await supabase
      .from('admin_settings')
      .select('*')
      .single();

    const messages = [];

    // Process race documents first
    if (race.race_documents?.length) {
      try {
        console.log('Processing race documents:', race.race_documents.length);
        const processedDocuments = await processRaceDocuments(race, supabaseUrl);
        console.log('Successfully processed race documents:', {
          processedCount: processedDocuments.length,
          documentDetails: processedDocuments.map(doc => ({
            type: doc.type,
            mediaType: doc.source.media_type,
            dataLength: doc.source.data.length
          }))
        });

        // Add each race document as text content
        for (const doc of processedDocuments) {
          messages.push({
            role: "user",
            content: [
              { 
                type: "text", 
                text: `Document content (${doc.source.media_type}): ${doc.source.data}`
              }
            ]
          });
        }
      } catch (error) {
        console.error('Error processing race documents:', error);
      }
    }

    // Add conversation history
    if (conversationHistory?.length > 0) {
      console.log('Adding conversation history:', conversationHistory.length, 'messages');
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: [{ type: "text", text: msg.message }]
      })));
    }

    // Add current message with any uploaded image
    const currentContent = [];
    
    if (imageData) {
      try {
        console.log('Processing new image upload:', {
          type: imageData.type,
          dataLength: imageData.data.length
        });
        
        // Handle image uploads
        if (imageData.type.startsWith('image/')) {
          currentContent.push({
            type: "image",
            source: {
              type: "base64",
              media_type: imageData.type,
              data: imageData.data
            }
          });
        } else {
          // Handle non-image uploads as text
          currentContent.push({
            type: "text",
            text: `Document content (${imageData.type}): ${imageData.data}`
          });
        }
        
        console.log('Successfully added content to message');
      } catch (error) {
        console.error('Error processing uploaded content:', error);
      }
    }

    if (message) {
      currentContent.push({ type: "text", text: message });
    }
    
    if (currentContent.length > 0) {
      messages.push({
        role: "user",
        content: currentContent
      });
    }

    // Generate race context
    const raceContext = await formatRaceContext(race);
    console.log('Generated race context length:', raceContext.length);

    console.log('Making request to Anthropic API with:', {
      messageCount: messages.length,
      hasDocuments: imageData !== undefined || (race.race_documents?.length > 0),
      modelUsed: settings?.anthropic_model,
      messagesStructure: messages.map(m => ({
        role: m.role,
        contentTypes: Array.isArray(m.content) 
          ? m.content.map(c => c.type)
          : typeof m.content
      }))
    });

    const response = await anthropic.messages.create({
      model: settings?.anthropic_model || 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: `${settings?.system_prompt || "You are a horse racing expert analyst who maintains a great knowledge of horse racing."}\n\nRace Context:\n${raceContext}`,
      messages,
    });

    console.log('Received response from Claude:', {
      responseLength: response.content[0].text.length,
      estimatedTokens: Math.ceil(response.content[0].text.length / 4),
      documentsIncluded: (imageData ? 1 : 0) + (race.race_documents?.length || 0)
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