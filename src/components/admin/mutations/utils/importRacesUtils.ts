import { supabase } from "@/integrations/supabase/client";

export const importHorseResults = async (horseId: string) => {
  const { data: resultsData } = await supabase.functions.invoke('fetch-horse-results', {
    body: { horseId }
  });
  
  if (resultsData?.results) {
    for (const result of resultsData.results) {
      await supabase
        .from('horse_results')
        .upsert({
          horse_id: horseId,
          race_id: result.race_id,
          date: result.date,
          course: result.course,
          distance: result.distance,
          class: result.class,
          going: result.going,
          position: result.position,
          weight_lbs: result.weight_lbs,
          winner: result.winner,
          second: result.second,
          third: result.third,
          winner_weight_lbs: result.winner_weight_lbs,
          second_weight_lbs: result.second_weight_lbs,
          third_weight_lbs: result.third_weight_lbs,
          winner_btn: result.winner_btn,
          second_btn: result.second_btn,
          third_btn: result.third_btn,
          comment: result.comment
        }, {
          onConflict: 'horse_id,race_id'
        });
    }
  }
};

export const importDistanceAnalysis = async (horseId: string) => {
  const { data: analysisData } = await supabase.functions.invoke('fetch-horse-results', {
    body: { 
      horseId,
      type: 'distance-analysis'
    }
  });
  
  if (analysisData && analysisData.id) {
    // Store the main analysis record
    const { data: analysis } = await supabase
      .from('horse_distance_analysis')
      .upsert({
        horse_id: analysisData.id,
        horse: analysisData.horse,
        sire: analysisData.sire,
        sire_id: analysisData.sire_id,
        dam: analysisData.dam,
        dam_id: analysisData.dam_id,
        damsire: analysisData.damsire,
        damsire_id: analysisData.damsire_id,
        total_runs: analysisData.total_runs
      })
      .select()
      .single();

    if (analysis && analysisData.distances) {
      for (const distance of analysisData.distances) {
        // Store distance details
        const { data: distanceDetail } = await supabase
          .from('horse_distance_details')
          .upsert({
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

        // Store times for this distance
        if (distanceDetail && distance.times) {
          for (const time of distance.times) {
            await supabase
              .from('horse_distance_times')
              .upsert({
                distance_detail_id: distanceDetail.id,
                date: time.date,
                region: time.region,
                course: time.course,
                time: time.time,
                going: time.going,
                position: time.position
              });
          }
        }
      }
    }
  }
};