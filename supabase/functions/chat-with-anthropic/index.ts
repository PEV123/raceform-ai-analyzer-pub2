import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, raceId, previousMessages } = await req.json();
    console.log('Received request:', { raceId, message });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get race details
    const { data: race, error: raceError } = await supabase
      .from('races')
      .select(`
        *,
        runners (*),
        race_documents (*)
      `)
      .eq('id', raceId)
      .single();

    if (raceError) throw raceError;

    // Construct the system message with race details
    const systemMessage = `You are a horse racing analysis assistant. You're analyzing a race at ${race.course} with ${race.field_size} runners. 
    The race class is ${race.race_class}, for ${race.age_band} horses, in the ${race.rating_band} rating band. 
    Prize money is ${race.prize}. Please provide detailed analysis and insights based on the user's questions.`;

    // Prepare messages for Claude
    const messages = [
      { role: 'system', content: systemMessage },
      ...previousMessages,
      { role: 'user', content: message }
    ];

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        messages: messages,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const anthropicResponse = await response.json();
    const assistantMessage = anthropicResponse.content[0].text;

    // Store the messages in the database
    const { error: insertError } = await supabase
      .from('race_chats')
      .insert([
        { race_id: raceId, message, role: 'user' },
        { race_id: raceId, message: assistantMessage, role: 'assistant' }
      ]);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-with-anthropic function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});