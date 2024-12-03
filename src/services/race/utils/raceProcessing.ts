import { supabase } from "@/integrations/supabase/client";
import { importHorseResults, importDistanceAnalysis } from "./horseAnalysis";

export const processRace = async (race: any) => {
  console.log(`Processing race at ${race.course}`);
  console.log('Raw race data:', JSON.stringify(race, null, 2));
  
  try {
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

    const { data: raceData, error: raceError } = await supabase
      .from("races")
      .insert({
        off_time: raceDateTime,
        course: race.course,
        race_name: race.race_name,
        region: race.region,
        race_class: race.race_class,
        age_band: race.age_band,
        rating_band: race.rating_band,
        prize: race.prize,
        field_size: Number(race.field_size) || 0,
        race_id: race.race_id,
        course_id: race.course_id,
        distance_round: race.distance_round,
        distance: race.distance,
        distance_f: race.distance_f,
        pattern: race.pattern,
        type: race.type,
        going_detailed: race.going_detailed,
        rail_movements: race.rail_movements,
        stalls: race.stalls,
        weather: race.weather,
        going: race.going,
        surface: race.surface,
        jumps: race.jumps,
        big_race: race.big_race,
        is_abandoned: race.is_abandoned,
      })
      .select();

    if (raceError) {
      console.error("Error inserting race:", raceError);
      throw raceError;
    }

    if (!raceData || raceData.length === 0) {
      console.error("No race data returned after insert");
      throw new Error("Failed to create race");
    }

    console.log('Successfully inserted race:', raceData[0]);
    return raceData[0];
  } catch (error) {
    console.error(`Error in processRace:`, error);
    throw error;
  }
};

const parseNumber = (value: any): number => {
  if (!value || value === 'NR' || value === '-') {
    return 0; // Default value for non-runners or invalid numbers
  }
  const parsed = parseInt(value);
  return isNaN(parsed) ? 0 : parsed;
};

export const processRunners = async (raceId: string, runners: any[]) => {
  if (!runners || !Array.isArray(runners)) {
    console.warn(`No runners found for race ${raceId}`);
    return { nonRunnerUpdates: 0, oddsUpdates: 0 };
  }

  let nonRunnerUpdates = 0;
  let oddsUpdates = 0;

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

  for (const runner of validRunners) {
    try {
      // First check if runner exists
      const { data: existingRunners, error: queryError } = await supabase
        .from("runners")
        .select("id, odds, is_non_runner")
        .eq("race_id", raceId)
        .eq("horse_id", runner.horse_id);

      if (queryError) {
        console.error(`Error querying runner ${runner.horse_id}:`, queryError);
        continue;
      }

      // Ensure numeric fields are properly converted
      const runnerData = {
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
      };

      const existingRunner = existingRunners && existingRunners[0];

      if (existingRunner) {
        // Check for non-runner status change
        if (existingRunner.is_non_runner !== runner.is_non_runner) {
          nonRunnerUpdates++;
        }

        // Check for odds changes
        const hasOddsChanged = JSON.stringify(existingRunner.odds) !== JSON.stringify(runner.odds);
        
        // Update existing runner
        const { error: updateError } = await supabase
          .from("runners")
          .update({
            is_non_runner: runner.is_non_runner,
            odds: runner.odds
          })
          .eq("id", existingRunner.id);

        if (updateError) {
          console.error("Error updating runner:", updateError);
          continue;
        }

        if (hasOddsChanged) {
          await saveOddsHistory(existingRunner.id, runner.odds);
          oddsUpdates++;
        }
      } else {
        console.log(`Inserting new runner:`, runnerData);
        // Insert new runner
        const { error: insertError } = await supabase
          .from("runners")
          .insert(runnerData);

        if (insertError) {
          console.error(`Error inserting new runner ${runner.horse_id}:`, insertError);
          continue;
        }

        console.log(`Successfully inserted new runner: ${runner.horse}`);
      }

      // After inserting/updating runner, fetch and store historical results and analysis
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

const saveOddsHistory = async (runnerId: string, odds: any[]) => {
  const { error } = await supabase
    .from("odds_history")
    .insert({
      runner_id: runnerId,
      odds: odds
    });

  if (error) {
    console.error("Error saving odds history:", error);
    throw error;
  }
};