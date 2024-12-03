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
        await processRaceResult(horseId, race);
      }
    }
  } catch (error) {
    console.error(`Error in processHorseResults:`, error);
    throw error;
  }
};

async function processRaceResult(horseId: string, race: any) {
  console.log('Processing race result:', race);
  
  // Find this horse's performance in the race
  const horsePerformance = race.runners?.find(
    (runner: any) => runner.horse_id === horseId
  );

  if (!horsePerformance) {
    console.warn(`No performance data found for horse ${horseId} in race ${race.race_id}`);
    return;
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