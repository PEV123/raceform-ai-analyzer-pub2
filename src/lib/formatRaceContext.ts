import { supabase } from "@/integrations/supabase/client";

export const formatRaceContext = async (race: any) => {
  // Fetch historical results for all runners
  const horseIds = race.runners.map((runner: any) => runner.horse_id);
  const { data: historicalResults } = await supabase
    .from('horse_results')
    .select('*')
    .in('horse_id', horseIds)
    .order('date', { ascending: false });

  const raceContext = `
Race Details:
${race.race_name} at ${race.course}
${race.off_time} - ${race.distance} - ${race.going}
Class: ${race.race_class}
Prize: ${race.prize}

Runners:
${race.runners.map((runner: any) => {
  const horseResults = historicalResults?.filter(r => r.horse_id === runner.horse_id) || [];
  
  return `
${runner.horse} (${runner.age}yo ${runner.sex})
Jockey: ${runner.jockey}
Trainer: ${runner.trainer}
Weight: ${runner.weight}
Recent Form: ${horseResults.slice(0, 5).map(r => 
  `${r.position}/${r.runners?.length} - ${r.course} (${r.distance}) - ${r.going}`
).join(', ')}
Comments: ${horseResults.slice(0, 3).map(r => r.comment).filter(Boolean).join(' | ')}
  `;
}).join('\n')}
`;

  return raceContext;
};