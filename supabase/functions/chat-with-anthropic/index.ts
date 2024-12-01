import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.14.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { processImage } from "./imageProcessing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    if (raceError) throw raceError;
    console.log('Fetched race data with runners:', race.runners?.length);

    // Process any race documents for vision analysis
    const messages = [];
    let totalImagesProcessed = 0;
    let failedImages = 0;

    if (race.race_documents?.length) {
      console.log(`Processing ${race.race_documents.length} race documents for vision analysis`);
      const imageDocuments = race.race_documents
        .filter(doc => doc.content_type?.startsWith('image/'));
      
      console.log(`Found ${imageDocuments.length} image documents to process`);

      for (const doc of imageDocuments) {
        const imageUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/race_documents/${doc.file_path}`;
        const processedImage = await processImage(imageUrl, doc.file_name, doc.content_type);
        
        if (processedImage) {
          messages.push({
            role: "user",
            content: [
              processedImage,
              {
                type: "text",
                text: "Please analyze this race document."
              }
            ]
          });
          totalImagesProcessed++;
        } else {
          failedImages++;
        }
      }
    }

    // Format the race context
    const raceContext = `
Race Details:
- Course: ${race.course}
- Time: ${race.off_time}
- Class: ${race.race_class}
- Prize: ${race.prize}
- Going: ${race.going}
- Distance: ${race.distance_round || race.distance}
${race.runners?.map(runner => `
${runner.number}. ${runner.horse}
- Jockey: ${runner.jockey}
- Trainer: ${runner.trainer}
- Weight: ${runner.lbs}lbs
- Form: ${runner.form || 'No form'}
`).join('\n') || 'No runners data available'}
    `.trim();

    console.log('Generated race context length:', raceContext.length);

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    });

    // Add the current message
    messages.push({
      role: "user",
      content: message
    });

    console.log('Making request to Anthropic API with:', {
      messageCount: messages.length,
      systemPromptLength: raceContext.length,
      historyLength: conversationHistory?.length || 0,
      totalImagesProcessed,
      failedImages
    });

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      system: `You are a horse racing expert analyst who maintains a great knowledge of horse racing.

Race Context:
${raceContext}`,
      messages: messages
    });

    console.log('Received response from Claude:', {
      responseLength: response.content[0].text.length,
      estimatedTokens: Math.ceil(response.content[0].text.length / 4),
      imagesIncluded: totalImagesProcessed
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
        details: {
          processedImages: totalImagesProcessed,
          failedImages: failedImages
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});