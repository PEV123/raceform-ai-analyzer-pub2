import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.14.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders, processRaceDocuments, formatRaceContext } from "./utils.ts";
import { processMessages } from "./messageProcessing.ts";
import { truncateContext } from "./contextProcessing.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, raceId, conversationHistory, imageData } = await req.json();
    console.log('Request payload:', { 
      messageLength: message?.length,
      raceId,
      historyLength: conversationHistory?.length,
      hasImageData: !!imageData,
      imageType: imageData?.type
    });

    if (!raceId) {
      throw new Error('Race ID is required');
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || ''
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

    // Process race documents
    let processedDocuments = [];
    if (race.race_documents?.length) {
      try {
        console.log('Processing race documents:', {
          count: race.race_documents.length,
          documents: race.race_documents.map(doc => ({
            name: doc.file_name,
            type: doc.content_type,
            path: doc.file_path
          }))
        });
        processedDocuments = await processRaceDocuments(race, supabaseUrl);
        console.log('Successfully processed documents:', {
          count: processedDocuments.length,
          types: processedDocuments.map(doc => doc.type)
        });
      } catch (error) {
        console.error('Error processing race documents:', error);
      }
    }

    // Generate and truncate race context
    const raceContext = truncateContext(await formatRaceContext(race));
    console.log('Generated race context:', {
      length: raceContext.length,
      preview: raceContext.substring(0, 200) + '...'
    });

    // Process messages with limits
    const messages = processMessages(conversationHistory, message, processedDocuments, imageData);
    
    console.log('Prepared messages for Claude:', {
      totalMessages: messages.length,
      messageTypes: messages.map(msg => ({
        role: msg.role,
        contentTypes: msg.content.map(c => c.type)
      }))
    });

    const systemPrompt = `${settings?.system_prompt || "You are a horse racing expert analyst who maintains a great knowledge of horse racing."}\n\nRace Context:\n${raceContext}`;
    
    console.log('System prompt:', {
      length: systemPrompt.length,
      preview: systemPrompt.substring(0, 200) + '...'
    });

    const response = await anthropic.messages.create({
      model: settings?.anthropic_model || 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    console.log('Claude response:', {
      responseLength: response.content[0].text.length,
      preview: response.content[0].text.substring(0, 100) + '...',
      estimatedTokens: Math.ceil(response.content[0].text.length / 4)
    });

    return new Response(
      JSON.stringify({ message: response.content[0].text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-with-anthropic function:', {
      error: error.message,
      stack: error.stack,
      details: error.toString()
    });
    
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