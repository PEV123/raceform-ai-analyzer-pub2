import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const processBase64Image = (message: string) => {
  if (message.startsWith('data:image')) {
    const [header, base64Data] = message.split(',');
    const mediaType = header.split(';')[0].split(':')[1];
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: base64Data
      }
    };
  }
  return null;
};

export const fetchRaceData = async (raceId: string) => {
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

  if (raceError) throw raceError;
  return race;
};

export const fetchSettings = async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  const { data: settings } = await supabase
    .from('admin_settings')
    .select('*')
    .single();

  return settings;
};

export const formatRaceContext = (race: any) => {
  const raceDetails = `
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
${runner.stable_tour?.length ? `\nStable Tour:\n${runner.stable_tour.map((t: any) => `"${t.quote}"`).join('\n')}` : ''}
`).join('\n')}
`;

  console.log('Generated race context with details for all runners');
  return raceDetails;
};

export const processRaceDocuments = async (race: any, supabaseUrl: string) => {
  console.log('Processing race documents...');
  console.log('Number of documents:', race.race_documents?.length);
  
  const documentImages = await Promise.all((race.race_documents || [])
    .filter((doc: any) => doc.content_type?.startsWith('image/'))
    .map(async (doc: any) => {
      const url = `${supabaseUrl}/storage/v1/object/public/race_documents/${doc.file_path}`;
      console.log('Processing document URL:', url);
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error('Failed to fetch image:', response.statusText);
          return null;
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const chunkSize = 32768;
        let binary = '';
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
        }
        const base64 = btoa(binary);
        
        console.log('Successfully processed image to base64');
        
        return {
          type: "image",
          source: {
            type: "base64",
            media_type: doc.content_type,
            data: base64
          }
        };
      } catch (error) {
        console.error('Error processing image:', error);
        return null;
      }
    }));

  return documentImages.filter(img => img !== null);
};