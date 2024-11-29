import { supabase } from "@/integrations/supabase/client";

export const formatRaceContext = async (race: any) => {
  if (!race) return "No race data available";

  // Fetch historical results for all runners
  const horseIds = race.runners?.map((runner: any) => runner.horse_id) || [];
  
  // Fetch both historical results and distance analysis
  const [historicalResults, distanceAnalyses] = await Promise.all([
    supabase
      .from('horse_results')
      .select('*')
      .in('horse_id', horseIds)
      .order('date', { ascending: false }),
    supabase
      .from('horse_distance_analysis')
      .select(`
        *,
        horse_distance_details (
          *,
          horse_distance_times (*)
        )
      `)
      .in('horse_id', horseIds)
  ]);

  console.log('Fetched historical results:', historicalResults.data?.length);
  console.log('Fetched distance analyses:', distanceAnalyses.data?.length);

  const getHorseAnalysis = (horseId: string) => {
    return distanceAnalyses.data?.find(analysis => analysis.horse_id === horseId);
  };

  const formatTimeAnalysis = (analysis: any) => {
    if (!analysis?.horse_distance_details?.length) return 'No time analysis available';

    return analysis.horse_distance_details.map((detail: any) => {
      const times = detail.horse_distance_times || [];
      const avgTime = times.reduce((acc: number, time: any) => {
        if (!time.time || time.time === '-') return acc;
        const [mins, secs] = time.time.split(':').map(Number);
        return acc + (mins * 60 + secs);
      }, 0) / (times.length || 1);

      return `
Distance: ${detail.dist}
Runs: ${detail.runs || 0}
Win Rate: ${detail.win_percentage || 0}%
Place Rate: ${((detail.wins + detail.second_places + detail.third_places) / (detail.runs || 1) * 100).toFixed(1)}%
Average Time: ${avgTime ? `${Math.floor(avgTime / 60)}:${(avgTime % 60).toFixed(2)}` : 'N/A'}
Recent Times: ${times.slice(0, 3).map((t: any) => `${t.time || '-'} (${t.going || 'unknown going'})`).join(', ')}`;
    }).join('\n');
  };

  const raceContext = `
Race Details:
${race.race_name} at ${race.course}
${race.off_time} - ${race.distance} - ${race.going}
Class: ${race.race_class}
Prize: ${race.prize}

Runners:
${race.runners?.map((runner: any) => {
  const horseResults = historicalResults.data?.filter(result => result.horse_id === runner.horse_id) || [];
  const timeAnalysis = getHorseAnalysis(runner.horse_id);
  
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
Weight: ${runner.lbs}
Recent Form: ${horseResults.map(result => 
  `${result.position || '-'}/${getRunnerCount(result)} - ${result.course} (${result.distance || '-'}) - ${result.going || '-'}`
).join(', ') || 'No recent form'}
Comments: ${horseResults.slice(0, 3).map(result => result.comment).filter(Boolean).join(' | ') || 'No comments'}

Time Analysis:
${formatTimeAnalysis(timeAnalysis)}
  `;
}).join('\n') || 'No runners available'}
`;

  console.log('Generated race context with details for all runners including time analysis');
  return raceContext;
};