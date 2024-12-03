import { supabase } from "@/integrations/supabase/client";

export const importHorseResults = async (horseId: string) => {
  console.log('Importing results for horse:', horseId);
  
  const { data: resultsData, error } = await supabase.functions.invoke('fetch-horse-results', {
    body: { horseId }
  });
  
  if (error) {
    console.error('Error fetching horse results:', error);
    throw error;
  }

  console.log('Raw API response:', resultsData);
  
  if (resultsData?.results) {
    for (const race of resultsData.results) {
      console.log('Processing race result:', race);
      
      // Find this horse's performance in the race
      const horsePerformance = race.runners?.find(
        (runner: any) => runner.horse_id === horseId
      );

      if (!horsePerformance) {
        console.warn(`No performance data found for horse ${horseId} in race ${race.race_id}`);
        continue;
      }

      // Find winner, second and third place horses
      const winner = race.runners?.find((r: any) => r.position === "1");
      const second = race.runners?.find((r: any) => r.position === "2");
      const third = race.runners?.find((r: any) => r.position === "3");

      const resultData = {
        horse_id: horseId,
        race_id: race.race_id,
        date: race.off_dt || race.date,
        course: race.course,
        distance: race.dist,
        class: race.class,
        going: race.going,
        position: horsePerformance.position,
        weight_lbs: parseInt(horsePerformance.weight_lbs) || null,
        winner: winner?.horse || null,
        second: second?.horse || null,
        third: third?.horse || null,
        winner_weight_lbs: winner?.weight_lbs ? parseInt(winner.weight_lbs) : null,
        second_weight_lbs: second?.weight_lbs ? parseInt(second.weight_lbs) : null,
        third_weight_lbs: third?.weight_lbs ? parseInt(third.weight_lbs) : null,
        winner_btn: winner?.btn || null,
        second_btn: second?.btn || null,
        third_btn: third?.btn || null,
        comment: horsePerformance.comment || null
      };

      const { error: insertError } = await supabase
        .from('horse_results')
        .upsert(resultData, {
          onConflict: 'horse_id,race_id'
        });

      if (insertError) {
        console.error('Error inserting horse result:', insertError);
        throw insertError;
      }

      console.log('Successfully inserted result for race:', race.race_id);
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
      .select();

    if (analysis && analysis[0] && analysisData.distances) {
      for (const distance of analysisData.distances) {
        // Store distance details
        const { data: distanceDetail } = await supabase
          .from('horse_distance_details')
          .upsert({
            analysis_id: analysis[0].id,
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
          .select();

        // Store times for this distance
        if (distanceDetail && distanceDetail[0] && distance.times) {
          for (const time of distance.times) {
            await supabase
              .from('horse_distance_times')
              .upsert({
                distance_detail_id: distanceDetail[0].id,
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