import { supabase } from "@/integrations/supabase/client";
import { parseNumber } from "./parseUtils";
import { processOddsUpdate } from "./oddsProcessing";
import { importHorseResults, importDistanceAnalysis } from "./horseAnalysis";

interface RunnerData {
  race_id: string;
  horse_id: string;
  number: number;
  draw: number;
  horse: string;
  silk_url: string | null;
  sire: string;
  sire_region: string;
  dam: string;
  dam_region: string;
  form: string | null;
  lbs: number;
  headgear: string | null;
  ofr: string | null;
  ts: string | null;
  jockey: string;
  trainer: string;
  odds: any[];
  is_non_runner: boolean;
  [key: string]: any; // Allow additional fields
}

const prepareRunnerData = (runner: any, raceId: string): RunnerData => ({
  race_id: raceId,
  horse_id: runner.horse_id,
  number: parseNumber(runner.number),
  draw: parseNumber(runner.draw),
  horse: runner.horse,
  silk_url: runner.silk_url,
  sire: runner.sire,
  sire_region: runner.sire_region,
  dam: runner.dam,
  dam_region: runner.dam_region,
  form: runner.form,
  lbs: parseNumber(runner.lbs),
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
});

const processExistingRunner = async (
  existingRunner: any,
  runner: any
): Promise<{ nonRunnerUpdate: boolean; oddsUpdate: boolean }> => {
  const nonRunnerUpdate = existingRunner.is_non_runner !== runner.is_non_runner;
  const oddsUpdate = await processOddsUpdate(existingRunner, runner.odds || []);

  const { error: updateError } = await supabase
    .from("runners")
    .update({
      is_non_runner: runner.is_non_runner,
      odds: runner.odds
    })
    .eq("id", existingRunner.id);

  if (updateError) {
    console.error("Error updating runner:", updateError);
    throw updateError;
  }

  return { nonRunnerUpdate, oddsUpdate };
};

const insertNewRunner = async (runnerData: RunnerData): Promise<void> => {
  console.log(`Inserting new runner:`, runnerData);
  
  const { error: insertError } = await supabase
    .from("runners")
    .insert(runnerData);

  if (insertError) {
    console.error(`Error inserting new runner ${runnerData.horse_id}:`, insertError);
    throw insertError;
  }

  console.log(`Successfully inserted new runner: ${runnerData.horse}`);
};

export const processRunner = async (
  runner: any,
  raceId: string
): Promise<{ nonRunnerUpdate: boolean; oddsUpdate: boolean }> => {
  try {
    // Check if runner exists
    const { data: existingRunners, error: queryError } = await supabase
      .from("runners")
      .select("id, odds, is_non_runner")
      .eq("race_id", raceId)
      .eq("horse_id", runner.horse_id);

    if (queryError) {
      console.error(`Error querying runner ${runner.horse_id}:`, queryError);
      throw queryError;
    }

    const existingRunner = existingRunners && existingRunners[0];
    const runnerData = prepareRunnerData(runner, raceId);

    if (existingRunner) {
      const updates = await processExistingRunner(existingRunner, runner);
      return updates;
    } else {
      await insertNewRunner(runnerData);
      return { nonRunnerUpdate: false, oddsUpdate: false };
    }
  } catch (error) {
    console.error(`Error processing runner ${runner.horse_id}:`, error);
    throw error;
  }
};

export const processRunners = async (raceId: string, runners: any[]) => {
  if (!runners || !Array.isArray(runners)) {
    console.warn(`No runners found for race ${raceId}`);
    return { nonRunnerUpdates: 0, oddsUpdates: 0 };
  }

  const validRunners = runners.filter(runner => {
    const isValid = runner.horse_id && 
                   runner.horse && 
                   runner.sire && 
                   runner.sire_region && 
                   runner.dam && 
                   runner.dam_region && 
                   runner.trainer;
    
    if (!isValid) {
      console.warn(`Skipping runner ${runner.horse} due to missing required fields`);
    }
    return isValid;
  });

  console.log(`Processing ${validRunners.length} valid runners for race ${raceId}`);

  let nonRunnerUpdates = 0;
  let oddsUpdates = 0;

  for (const runner of validRunners) {
    try {
      const { nonRunnerUpdate, oddsUpdate } = await processRunner(runner, raceId);
      
      if (nonRunnerUpdate) nonRunnerUpdates++;
      if (oddsUpdate) oddsUpdates++;

      // Process historical data
      try {
        await importHorseResults(runner.horse_id);
        await importDistanceAnalysis(runner.horse_id);
      } catch (historyError) {
        console.error(`Error processing historical data for horse ${runner.horse_id}:`, historyError);
      }
    } catch (error) {
      console.error(`Error processing runner ${runner.horse_id}:`, error);
      continue;
    }
  }

  return { nonRunnerUpdates, oddsUpdates };
};