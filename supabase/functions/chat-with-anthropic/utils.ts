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
  if (!race) return "No race data available";
  
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
`).join('\n')}`;

  return raceDetails;
};