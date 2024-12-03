import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ImportStats, HorseData } from "./types.ts";

const RACING_API_URL = Deno.env.get('RACING_API_URL') || '';
const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME') || '';
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD') || '';
const BATCH_SIZE = 5; // Process 5 horses at a time

async function fetchFromRacingApi(endpoint: string) {
  console.log(`Making request to Racing API: ${endpoint}`);
  
  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Basic ${btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API request failed: ${response.status} - ${errorText}`);
    throw new Error(`API request failed: ${response.status} at ${endpoint}`);
  }

  return response.json();
}

export async function processHorseBatch(
  supabase: any,
  horses: HorseData[],
  stats: ImportStats
): Promise<void> {
  console.log(`Processing batch of ${horses.length} horses`);

  const promises = horses.map(horse => processHorse(supabase, horse, stats));
  await Promise.all(promises);
}

async function processHorse(
  supabase: any,
  horse: HorseData,
  stats: ImportStats
): Promise<void> {
  console.log(`Processing horse: ${horse.horseName} (${horse.horseId})`);

  try {
    await processHorseResults(supabase, horse.horseId, stats);
    await processHorseDistanceAnalysis(supabase, horse.horseId, stats);
  } catch (error) {
    console.error(`Error processing horse ${horse.horseId}:`, error);
    stats.horseResults.failed++;
    stats.distanceAnalysis.failed++;
  }
}

async function processHorseResults(
  supabase: any,
  horseId: string,
  stats: ImportStats
): Promise<void> {
  console.log('Processing results for horse:', horseId);
  stats.horseResults.attempted++;
  
  try {
    const data = await fetchFromRacingApi(`${RACING_API_URL}/horses/${horseId}/results`);
    
    if (data?.results) {
      // Delete existing results
      const { error: deleteError } = await supabase
        .from('horse_results')
        .delete()
        .eq('horse_id', horseId);

      if (deleteError) throw deleteError;

      // Insert new results
      for (const result of data.results) {
        const resultData = prepareHorseResultData(result, horseId);
        const { error: insertError } = await supabase
          .from('horse_results')
          .insert(resultData);

        if (insertError) throw insertError;
      }

      stats.horseResults.successful++;
    }
  } catch (error) {
    console.error(`Error processing results for horse ${horseId}:`, error);
    stats.horseResults.failed++;
    throw error;
  }
}

async function processHorseDistanceAnalysis(
  supabase: any,
  horseId: string,
  stats: ImportStats
): Promise<void> {
  console.log('Processing distance analysis for horse:', horseId);
  stats.distanceAnalysis.attempted++;
  
  try {
    const data = await fetchFromRacingApi(`${RACING_API_URL}/horses/${horseId}/analysis/distance-times`);
    
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

function prepareHorseResultData(result: any, horseId: string) {
  const horsePerformance = result.runners?.find(
    (runner: any) => runner.horse_id === horseId
  );

  return {
    horse_id: horseId,
    race_id: result.race_id,
    date: new Date(result.off_dt || result.date).toISOString(),
    course: result.course,
    distance: result.dist,
    class: result.class,
    going: result.going,
    position: horsePerformance?.position,
    weight_lbs: parseInt(horsePerformance?.weight_lbs) || null,
    winner: result.runners?.find((r: any) => r.position === "1")?.horse || null,
    second: result.runners?.find((r: any) => r.position === "2")?.horse || null,
    third: result.runners?.find((r: any) => r.position === "3")?.horse || null,
    winner_weight_lbs: parseInt(result.runners?.find((r: any) => r.position === "1")?.weight_lbs) || null,
    second_weight_lbs: parseInt(result.runners?.find((r: any) => r.position === "2")?.weight_lbs) || null,
    third_weight_lbs: parseInt(result.runners?.find((r: any) => r.position === "3")?.weight_lbs) || null,
    winner_btn: result.runners?.find((r: any) => r.position === "1")?.btn || null,
    second_btn: result.runners?.find((r: any) => r.position === "2")?.btn || null,
    third_btn: result.runners?.find((r: any) => r.position === "3")?.btn || null,
    comment: horsePerformance?.comment || null
  };
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

export function splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}