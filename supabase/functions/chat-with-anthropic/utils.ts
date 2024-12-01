import { createClient } from "@supabase/supabase-js";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const fetchRaceData = async (raceId: string) => {
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

export const fetchSettings = async () => {
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

export const processRaceDocuments = async (race: any, supabaseUrl: string) => {
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

export const formatRaceContext = (race: any) => {
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