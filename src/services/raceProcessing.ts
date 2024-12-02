import { supabase } from "@/integrations/supabase/client";
import { saveOddsHistory } from "@/services/oddsHistory";

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
      console.log(`Race ${race.race_id} already exists, skipping`);
      return null;
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
      .select()
      .single();

    if (raceError) {
      console.error("Error inserting race:", raceError);
      throw raceError;
    }

    console.log('Successfully inserted race:', raceData);
    return raceData;
  } catch (error) {
    console.error(`Error in processRace:`, error);
    throw error;
  }
};

export const processRunners = async (raceId: string, runners: any[]) => {
  if (!runners || !Array.isArray(runners)) {
    console.warn(`No runners found for race ${raceId}`);
    return 0;
  }

  let nonRunnerUpdates = 0;
  let oddsUpdates = 0;

  const validRunners = runners
    .filter(runner => {
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

  if (validRunners.length > 0) {
    for (const runner of validRunners) {
      const { data: existingRunner } = await supabase
        .from("runners")
        .select("id, odds, is_non_runner")
        .eq("race_id", raceId)
        .eq("horse_id", runner.horse_id)
        .single();

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
          throw updateError;
        }

        // Save odds history if odds have changed
        if (hasOddsChanged) {
          await saveOddsHistory(existingRunner.id, runner.odds);
          oddsUpdates++;
        }
      }
    }
  }

  console.log(`Processed ${validRunners.length} runners:`, {
    nonRunnerUpdates,
    oddsUpdates
  });

  return nonRunnerUpdates;
};
