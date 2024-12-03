import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RACING_API_URL = Deno.env.get('RACING_API_URL') || '';
const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME') || '';
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD') || '';

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

export const processHorseResults = async (supabase: any, horseId: string) => {
  console.log('Processing results for horse:', horseId);
  
  try {
    const data = await fetchFromRacingApi(`${RACING_API_URL}/horses/${horseId}/results`);
    console.log(`Got ${data.results?.length || 0} results for horse ${horseId}`);

    if (data?.results) {
      // Delete existing results for this horse to ensure clean data
      const { error: deleteError } = await supabase
        .from('horse_results')
        .delete()
        .eq('horse_id', horseId);

      if (deleteError) {
        console.error(`Error deleting existing results for horse ${horseId}:`, deleteError);
        throw deleteError;
      }

      // Insert new results
      for (const result of data.results) {
        const horsePerformance = result.runners?.find(
          (runner: any) => runner.horse_id === horseId
        );

        if (!horsePerformance) {
          console.warn(`No performance data found for horse ${horseId} in race ${result.race_id}`);
          continue;
        }

        const resultData = {
          horse_id: horseId,
          race_id: result.race_id,
          date: new Date(result.off_dt || result.date).toISOString(),
          course: result.course,
          distance: result.dist,
          class: result.class,
          going: result.going,
          position: horsePerformance.position,
          weight_lbs: parseInt(horsePerformance.weight_lbs) || null,
          winner: result.runners?.find((r: any) => r.position === "1")?.horse || null,
          second: result.runners?.find((r: any) => r.position === "2")?.horse || null,
          third: result.runners?.find((r: any) => r.position === "3")?.horse || null,
          winner_weight_lbs: parseInt(result.runners?.find((r: any) => r.position === "1")?.weight_lbs) || null,
          second_weight_lbs: parseInt(result.runners?.find((r: any) => r.position === "2")?.weight_lbs) || null,
          third_weight_lbs: parseInt(result.runners?.find((r: any) => r.position === "3")?.weight_lbs) || null,
          winner_btn: result.runners?.find((r: any) => r.position === "1")?.btn || null,
          second_btn: result.runners?.find((r: any) => r.position === "2")?.btn || null,
          third_btn: result.runners?.find((r: any) => r.position === "3")?.btn || null,
          comment: horsePerformance.comment || null
        };

        const { error: insertError } = await supabase
          .from('horse_results')
          .insert(resultData);

        if (insertError) {
          console.error(`Error storing result for horse ${horseId}:`, insertError);
          throw insertError;
        }

        console.log(`Stored result for horse ${horseId} in race ${result.race_id}`);
      }
    }
  } catch (error) {
    console.error(`Error processing results for horse ${horseId}:`, error);
    throw error;
  }
};

export const processHorseDistanceAnalysis = async (supabase: any, horseId: string) => {
  console.log('Processing distance analysis for horse:', horseId);
  
  try {
    const data = await fetchFromRacingApi(`${RACING_API_URL}/horses/${horseId}/analysis/distance-times`);
    console.log('Got distance analysis for horse:', horseId);

    if (data && data.id) {
      // Delete existing analysis for this horse
      const { error: deleteAnalysisError } = await supabase
        .from('horse_distance_analysis')
        .delete()
        .eq('horse_id', horseId);

      if (deleteAnalysisError) {
        console.error(`Error deleting existing analysis for horse ${horseId}:`, deleteAnalysisError);
        throw deleteAnalysisError;
      }

      // Store main analysis record
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

      if (analysisError) {
        console.error(`Error storing analysis for horse ${horseId}:`, analysisError);
        throw analysisError;
      }

      if (analysis && data.distances) {
        for (const distance of data.distances) {
          // Store distance details
          const { data: distanceDetail, error: distanceError } = await supabase
            .from('horse_distance_details')
            .insert({
              analysis_id: analysis.id,
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

          if (distanceError) {
            console.error(`Error storing distance details for horse ${horseId}:`, distanceError);
            throw distanceError;
          }

          // Store times for this distance
          if (distanceDetail && distance.times) {
            // Delete existing times for this distance detail
            const { error: deleteTimesError } = await supabase
              .from('horse_distance_times')
              .delete()
              .eq('distance_detail_id', distanceDetail.id);

            if (deleteTimesError) {
              console.error(`Error deleting existing times for horse ${horseId}:`, deleteTimesError);
              throw deleteTimesError;
            }

            for (const time of distance.times) {
              const { error: timeError } = await supabase
                .from('horse_distance_times')
                .insert({
                  distance_detail_id: distanceDetail.id,
                  date: new Date(time.date).toISOString(),
                  region: time.region,
                  course: time.course,
                  time: time.time,
                  going: time.going,
                  position: time.position
                });

              if (timeError) {
                console.error(`Error storing time for horse ${horseId}:`, timeError);
                throw timeError;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error processing distance analysis for horse ${horseId}:`, error);
    throw error;
  }
};