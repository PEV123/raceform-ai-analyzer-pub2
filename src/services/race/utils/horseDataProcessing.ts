import { supabase } from "@/integrations/supabase/client";

export const processHorseResults = async (horseId: string) => {
  console.log('Processing results for horse:', horseId);
  
  try {
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
          winner: race.runners?.find((r: any) => r.position === "1")?.horse || null,
          second: race.runners?.find((r: any) => r.position === "2")?.horse || null,
          third: race.runners?.find((r: any) => r.position === "3")?.horse || null,
          winner_weight_lbs: parseInt(race.runners?.find((r: any) => r.position === "1")?.weight_lbs) || null,
          second_weight_lbs: parseInt(race.runners?.find((r: any) => r.position === "2")?.weight_lbs) || null,
          third_weight_lbs: parseInt(race.runners?.find((r: any) => r.position === "3")?.weight_lbs) || null,
          winner_btn: race.runners?.find((r: any) => r.position === "1")?.btn || null,
          second_btn: race.runners?.find((r: any) => r.position === "2")?.btn || null,
          third_btn: race.runners?.find((r: any) => r.position === "3")?.btn || null,
          comment: horsePerformance.comment || null
        };

        const { error: insertError } = await supabase
          .from('horse_results')
          .upsert(resultData);

        if (insertError) {
          console.error('Error inserting horse result:', insertError);
          throw insertError;
        }

        console.log('Successfully inserted result for race:', race.race_id);
      }
    }
  } catch (error) {
    console.error(`Error in processHorseResults:`, error);
    throw error;
  }
};

export const processHorseDistanceAnalysis = async (horseId: string) => {
  console.log('Processing distance analysis for horse:', horseId);
  
  try {
    const { data, error } = await supabase.functions.invoke('fetch-horse-results', {
      body: { 
        horseId,
        type: 'distance-analysis'
      }
    });

    if (error) {
      console.error('Error fetching distance analysis:', error);
      throw error;
    }

    if (data && data.id) {
      // Store the main analysis record
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

      if (analysisError) {
        console.error('Error storing analysis:', analysisError);
        throw analysisError;
      }

      if (analysis && data.distances) {
        for (const distance of data.distances) {
          // Store distance details
          const { data: distanceDetail, error: distanceError } = await supabase
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

          if (distanceError) {
            console.error('Error storing distance details:', distanceError);
            throw distanceError;
          }

          // Store times for this distance
          if (distanceDetail && distance.times) {
            for (const time of distance.times) {
              const { error: timeError } = await supabase
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

              if (timeError) {
                console.error('Error storing time:', timeError);
                throw timeError;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error in processHorseDistanceAnalysis:`, error);
    throw error;
  }
};