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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, raceId } = await req.json();
    console.log('Received request:', { raceId, message });

    if (!message || !raceId) {
      throw new Error('Missing required parameters: message or raceId');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get race details including runners and documents
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
      console.error('Error fetching race data:', raceError);
      throw raceError;
    }

    // Get admin settings for system context and knowledge base
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('*')
      .single();

    // Format runners data for better readability
    const formattedRunners = race.runners.map((runner: any) => `
      ${runner.number}. ${runner.horse} (Draw: ${runner.draw})
      - Jockey: ${runner.jockey}
      - Trainer: ${runner.trainer}
      - Form: ${runner.form || 'No form'}
      - Weight: ${runner.lbs}lbs
      - Breeding: By ${runner.sire} (${runner.sire_region}) out of ${runner.dam} (${runner.dam_region})
      ${runner.headgear ? `- Headgear: ${runner.headgear}` : ''}
      ${runner.ofr ? `- Official Rating: ${runner.ofr}` : ''}
      ${runner.ts ? `- Top Speed Rating: ${runner.ts}` : ''}
    `).join('\n');

    // Format race documents (images) as URLs
    const documentUrls = race.race_documents.map((doc: any) => 
      `https://vlcrqrmqghskrdhhsgqt.supabase.co/storage/v1/object/public/race_documents/${doc.file_path}`
    );

    // Construct the system message with all available context
    const systemMessage = `
      ${settings?.system_prompt || 'You are a horse racing expert analyst who maintains a great knowledge of horse racing.'}

      ${settings?.knowledge_base || ''}

      Race Analysis Context:
      Race: ${race.race_name} at ${race.course}
      Time: ${race.off_time}
      Class: ${race.race_class}
      Age Band: ${race.age_band}
      Rating Band: ${race.rating_band}
      Prize: ${race.prize}
      Field Size: ${race.field_size} runners

      Detailed Runner Information:
      ${formattedRunners}

      ${documentUrls.length > 0 ? `
      Race Documents/Images Available at:
      ${documentUrls.join('\n')}
      ` : 'No race documents uploaded.'}

      Please provide detailed analysis based on this information.
    `;

    console.log('Making request to Anthropic API...');

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        system: systemMessage,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from Anthropic');

    return new Response(
      JSON.stringify({ message: data.content[0].text }),
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