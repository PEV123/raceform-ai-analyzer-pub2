import { supabase } from "@/integrations/supabase/client";
import { processHorseResults, processHorseDistanceAnalysis } from "./horseDataProcessing";

interface ImportStats {
  horseResults: {
    attempted: number;
    successful: number;
    failed: number;
  };
  distanceAnalysis: {
    attempted: number;
    successful: number;
    failed: number;
  };
}

export const processRunner = async (supabase: any, raceId: string, runner: any, stats: ImportStats) => {
  try {
    // Prepare runner data
    const runnerData = {
      race_id: raceId,
      horse_id: runner.horse_id,
      number: parseInt(runner.number) || 0,
      draw: parseInt(runner.draw) || 0,
      horse: runner.horse,
      silk_url: runner.silk_url,
      sire: runner.sire,
      sire_region: runner.sire_region,
      dam: runner.dam,
      dam_region: runner.dam_region,
      form: runner.form,
      lbs: parseInt(runner.lbs) || 0,
      headgear: runner.headgear,
      ofr: runner.ofr,
      ts: runner.ts,
      jockey: runner.jockey,
      trainer: runner.trainer,
      odds: runner.odds || [],
      is_non_runner: runner.is_non_runner || false,
      dob: runner.dob,
      age: runner.age,
      sex: runner.sex,
      sex_code: runner.sex_code,
      colour: runner.colour,
      region: runner.region,
      breeder: runner.breeder,
      dam_id: runner.dam_id,
      damsire: runner.damsire,
      damsire_id: runner.damsire_id,
      damsire_region: runner.damsire_region,
      trainer_id: runner.trainer_id,
      trainer_location: runner.trainer_location,
      trainer_14_days: runner.trainer_14_days,
      owner: runner.owner,
      owner_id: runner.owner_id,
      prev_trainers: runner.prev_trainers || [],
      prev_owners: runner.prev_owners || [],
      comment: runner.comment,
      spotlight: runner.spotlight,
      quotes: runner.quotes || [],
      stable_tour: runner.stable_tour || [],
      medical: runner.medical || [],
      headgear_run: runner.headgear_run,
      wind_surgery: runner.wind_surgery,
      wind_surgery_run: runner.wind_surgery_run,
      past_results_flags: runner.past_results_flags || [],
      rpr: runner.rpr,
      jockey_id: runner.jockey_id,
      last_run: runner.last_run,
      trainer_rtf: runner.trainer_rtf
    };

    // Upsert runner data
    const { error: runnerError } = await supabase
      .from('runners')
      .upsert(runnerData, {
        onConflict: 'race_id,horse_id',
        returning: true
      });

    if (runnerError) {
      console.error(`Error upserting runner ${runner.horse_id}:`, runnerError);
      throw runnerError;
    }

    // Process horse historical data with delays between calls
    try {
      stats.horseResults.attempted++;
      await processHorseResults(supabase, runner.horse_id);
      stats.horseResults.successful++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (horseResultsError) {
      console.error(`Error processing horse results for ${runner.horse_id}:`, horseResultsError);
      stats.horseResults.failed++;
    }

    try {
      stats.distanceAnalysis.attempted++;
      await processHorseDistanceAnalysis(supabase, runner.horse_id);
      stats.distanceAnalysis.successful++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (analysisError) {
      console.error(`Error processing distance analysis for ${runner.horse_id}:`, analysisError);
      stats.distanceAnalysis.failed++;
    }
  } catch (error) {
    console.error(`Error processing runner ${runner.horse_id}:`, error);
    throw error;
  }
};