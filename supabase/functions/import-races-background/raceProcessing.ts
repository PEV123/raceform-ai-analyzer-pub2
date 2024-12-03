import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { prepareRaceData } from "./utils.ts";
import { processHorseResults, processHorseDistanceAnalysis } from "./horseDataProcessing.ts";

interface ImportStats {
  totalRaces: number;
  successfulRaces: number;
  failedRaces: number;
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

export const processRaceBatch = async (
  races: any[],
  supabase: any,
  stats: ImportStats,
  jobId: string
) => {
  console.log(`Processing batch of ${races.length} races`);
  
  for (const race of races) {
    try {
      console.log(`Processing race at ${race.course}`);
      
      // Prepare race data
      const raceData = prepareRaceData(race);
      console.log('Prepared race data:', raceData);
      
      // Upsert race data - this will update if exists, insert if not
      const { data: upsertedRace, error: raceError } = await supabase
        .from('races')
        .upsert(raceData, {
          onConflict: 'race_id',
          returning: true
        })
        .single();

      if (raceError) {
        console.error(`Error upserting race ${race.race_id}:`, raceError);
        stats.failedRaces++;
        continue;
      }
      
      stats.successfulRaces++;
      console.log(`Upserted race with ID ${upsertedRace.id}`);

      // Process runners
      if (race.runners?.length > 0) {
        console.log(`Processing ${race.runners.length} runners for race ${upsertedRace.id}`);
        
        // Process runners in batches of 2 to avoid overwhelming the API
        for (let i = 0; i < race.runners.length; i += 2) {
          const runnerBatch = race.runners.slice(i, i + 2);
          
          for (const runner of runnerBatch) {
            try {
              await processRunner(supabase, upsertedRace.id, runner, stats);
              // Add small delay between runners
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (runnerError) {
              console.error(`Error processing runner ${runner.horse_id}:`, runnerError);
            }
          }
        }
      }

    } catch (error) {
      console.error(`Error processing race:`, error);
      stats.failedRaces++;
    }
  }
};

const processRunner = async (supabase: any, raceId: string, runner: any, stats: ImportStats) => {
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