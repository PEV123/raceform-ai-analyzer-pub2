import { supabase } from "@/integrations/supabase/client";
import { validateRaceData, validateRunnerData } from "./validation";
import { updateExistingRunner, insertNewRunner } from "./runnerUpdates";
import { prepareRunnerData, prepareRaceData } from "./dataPreparation";

export const processRace = async (race: any) => {
  console.log(`Processing race at ${race.course}`);
  console.log('Raw race data:', JSON.stringify(race, null, 2));
  
  try {
    validateRaceData(race);

    // Check if race already exists
    const { data: existingRaces, error: queryError } = await supabase
      .from("races")
      .select("id")
      .eq("race_id", race.race_id);

    if (queryError) {
      console.error("Error checking existing race:", queryError);
      throw queryError;
    }

    if (existingRaces && existingRaces.length > 0) {
      console.log(`Race ${race.race_id} already exists, returning existing race`);
      return existingRaces[0];
    }

    // Use off_dt for the full datetime if available, otherwise construct from off_time
    const raceDateTime = race.off_dt || race.off_time;
    console.log('Using race datetime:', raceDateTime);

    const raceData = prepareRaceData(race, raceDateTime);
    const { data: insertedRace, error: raceError } = await supabase
      .from("races")
      .insert(raceData)
      .select()
      .single();

    if (raceError) {
      console.error("Error inserting race:", raceError);
      throw raceError;
    }

    console.log('Successfully inserted race:', insertedRace);
    return insertedRace;
  } catch (error) {
    console.error(`Error in processRace:`, error);
    throw error;
  }
};

export const processRunner = async (runner: any, raceId: string) => {
  try {
    if (!validateRunnerData(runner)) {
      console.warn(`Skipping invalid runner: ${runner.horse || 'unknown'}`);
      return { nonRunnerUpdate: false, oddsUpdate: false };
    }

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
      return await updateExistingRunner(existingRunner, runner);
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

  const validRunners = runners.filter(validateRunnerData);
  console.log(`Processing ${validRunners.length} valid runners for race ${raceId}`);

  let nonRunnerUpdates = 0;
  let oddsUpdates = 0;

  for (const runner of validRunners) {
    try {
      const { nonRunnerUpdate, oddsUpdate } = await processRunner(runner, raceId);
      if (nonRunnerUpdate) nonRunnerUpdates++;
      if (oddsUpdate) oddsUpdates++;
    } catch (error) {
      console.error(`Error processing runner ${runner.horse_id}:`, error);
      continue;
    }
  }

  return { nonRunnerUpdates, oddsUpdates };
};