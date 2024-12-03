import { fetchFromRacingApi } from "../api/racingApi.ts";
import { ImportStats } from "../types.ts";

export async function processHorseDistanceAnalysis(
  supabase: any,
  horseId: string,
  stats: ImportStats
): Promise<void> {
  console.log('Processing distance analysis for horse:', horseId);
  stats.distanceAnalysis.attempted++;
  
  try {
    const data = await fetchFromRacingApi(`${Deno.env.get('RACING_API_URL')}/horses/${horseId}/analysis/distance-times`);
    
    if (data?.id) {
      // Delete existing analysis
      await deleteExistingAnalysis(supabase, horseId);

      // Insert new analysis
      const analysis = await insertHorseAnalysis(supabase, data);
      
      if (data.distances) {
        await processDistances(supabase, data.distances, analysis.id);
      }

      stats.distanceAnalysis.successful++;
    }
  } catch (error) {
    console.error(`Error processing distance analysis for horse ${horseId}:`, error);
    stats.distanceAnalysis.failed++;
    throw error;
  }
}

async function deleteExistingAnalysis(supabase: any, horseId: string) {
  const { error: deleteError } = await supabase
    .from('horse_distance_analysis')
    .delete()
    .eq('horse_id', horseId);

  if (deleteError) throw deleteError;
}

async function insertHorseAnalysis(supabase: any, data: any) {
  const { data: analysis, error: analysisError } = await supabase
    .from('horse_distance_analysis')
    .insert({
      horse_id: data.id,
      horse: data.horse,
      sire: data.sire,
      sire_id: data.sire_id,
      dam: data.dam,
      dam_id: data.dam_id,
      damsire: data.damsire,
      damsire_id: data.damsire_id,
      total_runs: data.total_runs
    })
    .select()
    .single();

  if (analysisError) throw analysisError;
  return analysis;
}

async function processDistances(supabase: any, distances: any[], analysisId: string) {
  for (const distance of distances) {
    const { data: distanceDetail, error: distanceError } = await supabase
      .from('horse_distance_details')
      .insert({
        analysis_id: analysisId,
        dist: distance.dist,
        dist_y: distance.dist_y,
        dist_m: distance.dist_m,
        dist_f: distance.dist_f,
        runs: distance.runs,
        wins: distance['1st'],
        second_places: distance['2nd'],
        third_places: distance['3rd'],
        fourth_places: distance['4th'],
        ae_index: distance['a/e'],
        win_percentage: distance['win_%'],
        place_index: distance['1_pl']
      })
      .select()
      .single();

    if (distanceError) throw distanceError;

    if (distance.times) {
      await processDistanceTimes(supabase, distance.times, distanceDetail.id);
    }
  }
}

async function processDistanceTimes(supabase: any, times: any[], distanceDetailId: string) {
  for (const time of times) {
    const { error: timeError } = await supabase
      .from('horse_distance_times')
      .insert({
        distance_detail_id: distanceDetailId,
        date: new Date(time.date).toISOString(),
        region: time.region,
        course: time.course,
        time: time.time,
        going: time.going,
        position: time.position
      });

    if (timeError) throw timeError;
  }
}