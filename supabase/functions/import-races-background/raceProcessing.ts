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
      
      // Check if race exists
      const { data: existingRace } = await supabase
        .from('races')
        .select('id')
        .eq('race_id', race.race_id)
        .single();

      let raceId;
      if (existingRace) {
        raceId = existingRace.id;
        console.log(`Race ${race.race_id} already exists with ID ${raceId}`);
      } else {
        // Prepare and insert new race
        const raceData = prepareRaceData(race);
        const { data: newRace, error: raceError } = await supabase
          .from('races')
          .insert(raceData)
          .select()
          .single();

        if (raceError) {
          console.error(`Error inserting race ${race.race_id}:`, raceError);
          stats.failedRaces++;
          continue;
        }
        
        raceId = newRace.id;
        stats.successfulRaces++;
        console.log(`Inserted new race with ID ${raceId}`);
      }

      // Process runners in smaller batches
      if (race.runners?.length > 0) {
        console.log(`Processing ${race.runners.length} runners for race ${raceId}`);
        
        // Process runners in batches of 2
        for (let i = 0; i < race.runners.length; i += 2) {
          const runnerBatch = race.runners.slice(i, i + 2);
          
          // Process each runner in the batch sequentially
          for (const runner of runnerBatch) {
            try {
              await processRunner(supabase, raceId, runner, stats);
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
    const { data: existingRunner } = await supabase
      .from('runners')
      .select('id, odds, is_non_runner')
      .eq('race_id', raceId)
      .eq('horse_id', runner.horse_id)
      .single();

    if (existingRunner) {
      await supabase
        .from('runners')
        .update({
          odds: runner.odds || [],
          is_non_runner: runner.is_non_runner || false
        })
        .eq('id', existingRunner.id);
    } else {
      await supabase
        .from('runners')
        .insert({
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
          is_non_runner: runner.is_non_runner || false
        });
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