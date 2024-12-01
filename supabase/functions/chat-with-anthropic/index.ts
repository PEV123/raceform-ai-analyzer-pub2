import { serve } from "std/http/server.ts";
import { Anthropic } from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const fetchRaceData = async (raceId: string) => {
  console.log('Fetching race data for:', raceId);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

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

  console.log('Successfully fetched race data with documents:', race?.race_documents?.length);
  return race;
};

const fetchSettings = async () => {
  console.log('Fetching admin settings');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  const { data: settings, error } = await supabase
    .from('admin_settings')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }

  console.log('Successfully fetched admin settings');
  return settings;
};

const processRaceDocuments = async (race: any, supabaseUrl: string) => {
  console.log('Processing race documents:', race.race_documents?.length);
  const processedImages = [];
  
  if (race.race_documents?.length) {
    for (const doc of race.race_documents) {
      try {
        const response = await fetch(`${supabaseUrl}/storage/v1/object/public/race_documents/${doc.file_path}`);
        if (!response.ok) {
          console.error('Failed to fetch document:', doc.file_path);
          continue;
        }
        
        const blob = await response.blob();
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        if (typeof base64Data === 'string') {
          const [header, data] = base64Data.split(',');
          const mediaType = header.split(';')[0].split(':')[1];
          
          processedImages.push({
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: data
            }
          });
        }
      } catch (error) {
        console.error('Error processing document:', doc.file_path, error);
      }
    }
  }
  
  console.log('Successfully processed race documents:', processedImages.length);
  return processedImages;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, raceId, conversationHistory, images } = await req.json();
    console.log('Making request to Anthropic API with:', { 
      messageCount: conversationHistory?.length,
      systemPromptLength: raceId.length,
      historyLength: conversationHistory?.length || 0,
      totalImagesProcessed: images?.length || 0
    });

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    });

    const race = await fetchRaceData(raceId);
    const settings = await fetchSettings();
    console.log('Fetched race data with runners:', race.runners?.length);

    const raceContext = formatRaceContext(race);
    console.log('Generated race context length:', raceContext.length);

    const messages = [];

    // Add race documents as images if they exist
    if (race.race_documents?.length) {
      console.log('Processing race documents:', race.race_documents.length);
      const processedImages = await processRaceDocuments(race, Deno.env.get('SUPABASE_URL') || '');
      messages.push(...processedImages.map(img => ({
        role: "user",
        content: [img, { type: "text", text: "Please analyze this race document." }]
      })));
    }

    // Add conversation history
    if (conversationHistory?.length > 0) {
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.message
      })));
    }

    // Add current message with any uploaded image
    const currentContent = [];
    
    // Add any newly uploaded image from the chat
    if (images?.length > 0) {
      console.log('Processing newly uploaded chat images:', images.length);
      images.forEach(img => {
        currentContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.source.media_type,
            data: img.source.data
          }
        });
      });
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
      hasImages: images?.length > 0,
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
      imagesIncluded: images?.length || 0
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

const formatRaceContext = (race: any) => {
  if (!race) return "No race data available";
  
  return `
Race Details:
- Name: ${race.race_name}
- Course: ${race.course}
- Time: ${race.off_time}
- Class: ${race.race_class}
- Age Band: ${race.age_band}
- Rating Band: ${race.rating_band}
- Prize: ${race.prize}
- Field Size: ${race.field_size} runners
- Distance: ${race.distance_round || race.distance}
- Going: ${race.going}
- Surface: ${race.surface}
- Type: ${race.type}
${race.jumps ? `- Jumps: ${race.jumps}` : ''}

Runners:
${race.runners?.map((runner: any) => `
${runner.number}. ${runner.horse} (${runner.draw})
- Jockey: ${runner.jockey}
- Trainer: ${runner.trainer} (14 day form: ${runner.trainer_14_days?.wins}/${runner.trainer_14_days?.runs} - ${runner.trainer_14_days?.percent}%)
- Weight: ${runner.lbs}lbs
- Form: ${runner.form || 'No form'}
- Official Rating: ${runner.ofr || 'N/A'}
- Breeding: ${runner.sire} (${runner.sire_region}) x ${runner.dam} (${runner.dam_region})
- Last Run: ${runner.last_run || 'N/A'} days ago
${runner.medical?.length ? `- Medical History: ${runner.medical.map((m: any) => `${m.type} (${m.date})`).join(', ')}` : ''}
${runner.wind_surgery ? '- Has had wind surgery' : ''}
${runner.headgear ? `- Wearing: ${runner.headgear}` : ''}
${runner.comment ? `- Comment: ${runner.comment}` : ''}
${runner.spotlight ? `- Spotlight: ${runner.spotlight}` : ''}
${runner.quotes?.length ? `\nQuotes:\n${runner.quotes.map((q: any) => `"${q.quote}"`).join('\n')}` : ''}
${runner.stable_tour?.length ? `\nStable Tour:\n${runner.stable_tour.map((t: any) => `"${t.quote}"`).join('\n')}` : ''}`).join('\n')}`;
};