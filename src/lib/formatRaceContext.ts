import { supabase } from "@/integrations/supabase/client";

export const formatRaceContext = async (race: any) => {
  if (!race) return "No race data available";

  // Fetch historical results for all runners
  const horseIds = race.runners?.map((runner: any) => runner.horse_id) || [];
  const { data: historicalResults } = await supabase
    .from('horse_results')
    .select('*')
    .in('horse_id', horseIds)
    .order('date', { ascending: false });

  const raceContext = `
Race Details:
${race.race_name || 'Unnamed Race'} at ${race.course || 'Unknown Course'}
${race.off_time || 'No time'} - ${race.distance || 'Unknown distance'} - ${race.going || 'Unknown going'}
Class: ${race.race_class || 'Unknown class'}
Prize: ${race.prize || 'Unknown prize'}

Runners:
${race.runners?.map((runner: any) => {
  const horseResults = historicalResults?.filter(r => r.horse_id === runner.horse_id) || [];
  
  return `
${runner.horse} (${runner.age}yo ${runner.sex})
Jockey: ${runner.jockey}
Trainer: ${runner.trainer}
Weight: ${runner.weight || runner.lbs}
Recent Form: ${horseResults.slice(0, 5).map(r => 
  `${r.position}/${r.runners?.length || '-'} - ${r.course} (${r.distance}) - ${r.going}`
).join(', ') || 'No recent form'}
Comments: ${horseResults.slice(0, 3).map(r => r.comment).filter(Boolean).join(' | ') || 'No comments'}
  `;
}).join('\n') || 'No runners available'}
`;

  return raceContext;
};