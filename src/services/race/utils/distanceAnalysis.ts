import { supabase } from "@/integrations/supabase/client";

export const processHorseDistanceAnalysis = async (horseId: string) => {
  console.log('Processing distance analysis for horse:', horseId);
  
  try {
    const { data: analysisData } = await supabase.functions.invoke('fetch-horse-results', {
      body: { 
        horseId,
        type: 'distance-analysis'
      }
    });
    
    if (analysisData && analysisData.id) {
      const analysis = await storeMainAnalysis(analysisData);
      
      if (analysis && analysisData.distances) {
        await processDistances(analysisData.distances, analysis.id);
      }
    }
  } catch (error) {
    console.error(`Error processing distance analysis for horse ${horseId}:`, error);
    throw error;
  }
};

async function storeMainAnalysis(data: any) {
  const { data: analysis, error: analysisError } = await supabase
    .from('horse_distance_analysis')
    .upsert({
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

async function processDistances(distances: any[], analysisId: string) {
  for (const distance of distances) {
    const distanceDetail = await storeDistanceDetails(distance, analysisId);
    
    if (distance.times) {
      await processDistanceTimes(distance.times, distanceDetail.id);
    }
  }
}

async function storeDistanceDetails(distance: any, analysisId: string) {
  const { data: distanceDetail, error: distanceError } = await supabase
    .from('horse_distance_details')
    .upsert({
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
  return distanceDetail;
}

async function processDistanceTimes(times: any[], distanceDetailId: string) {
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