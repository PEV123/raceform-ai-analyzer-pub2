import { fetchFromRacingApi } from "../api/racingApi.ts";
import { ImportStats } from "../types.ts";

export async function processHorseResults(
  supabase: any,
  horseId: string,
  stats: ImportStats
): Promise<void> {
  console.log('Processing results for horse:', horseId);
  stats.horseResults.attempted++;
  
  try {
    const data = await fetchFromRacingApi(`${Deno.env.get('RACING_API_URL')}/horses/${horseId}/results`);
    
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