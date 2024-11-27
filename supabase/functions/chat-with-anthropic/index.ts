import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, raceId } = await req.json();
    console.log('Received request:', { raceId, message });

    if (!message || !raceId) {
      throw new Error('Missing required parameters: message or raceId');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Fetching race data...');
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

    console.log('Fetching admin settings...');
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('*')
      .single();

    const formattedRunners = race.runners.map((runner: any) => `
      ${runner.number}. ${runner.horse} (Draw: ${runner.draw})
      - Jockey: ${runner.jockey}
      - Trainer: ${runner.trainer}
      - Form: ${runner.form || 'No form'}
      - Weight: ${runner.lbs}lbs
      ${runner.headgear ? `- Headgear: ${runner.headgear}` : ''}
      ${runner.ofr ? `- Official Rating: ${runner.ofr}` : ''}
      ${runner.ts ? `- Top Speed Rating: ${runner.ts}` : ''}
    `).join('\n');

    // Create a simplified document summary instead of including base64 data
    const documentSummary = race.race_documents.map((doc: any) => {
      const url = `https://vlcrqrmqghskrdhhsgqt.supabase.co/storage/v1/object/public/race_documents/${doc.file_path}`;
      return `Race document: ${doc.file_name} (${doc.content_type})
URL: ${url}`;
    }).join('\n\n');

    const systemMessage = `
      ${settings?.system_prompt || 'You are a horse racing expert analyst who maintains a great knowledge of horse racing.'}

      Race Analysis Context:
      Race: ${race.race_name} at ${race.course}
      Time: ${race.off_time}
      Class: ${race.race_class}
      Age Band: ${race.age_band}
      Rating Band: ${race.rating_band}
      Prize: ${race.prize}
      Field Size: ${race.field_size} runners

      Runners:
      ${formattedRunners}

      Available Documents:
      ${documentSummary}

      Please provide analysis based on this information. The race documents are available at the URLs provided - you can reference them in your analysis but don't need to process them directly.
    `;

    console.log('Making request to Anthropic API');
    console.log('System message length:', systemMessage.length);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
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