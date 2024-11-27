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
  const horseResults = historicalResults?.filter(result => result.horse_id === runner.horse_id) || [];
  
  // Calculate total runners in each historical race
  const getRunnerCount = (result: any) => {
    if (result.winner && result.second && result.third) {
      return '3+';  // We know at least 3 runners
    }
    return '-';  // Unknown number of runners
  };
  
  return `
${runner.horse} (${runner.age}yo ${runner.sex})
Jockey: ${runner.jockey}
Trainer: ${runner.trainer}
Weight: ${runner.weight || runner.lbs}
Recent Form: ${horseResults.map(result => 
  `${result.position || '-'}/${getRunnerCount(result)} - ${result.course} (${result.distance || '-'}) - ${result.going || '-'}`
).join(', ') || 'No recent form'}
Comments: ${horseResults.slice(0, 3).map(result => result.comment).filter(Boolean).join(' | ') || 'No comments'}
  `;
}).join('\n') || 'No runners available'}
`;

  return raceContext;
};