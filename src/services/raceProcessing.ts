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

          // Save odds history if odds have changed
          if (hasOddsChanged) {
            await saveOddsHistory(existingRunner.id, runner.odds);
            oddsUpdates++;
          }
        } else {
          // Insert new runner
          const { error: insertError } = await supabase
            .from("runners")
            .insert({
              race_id: raceId,
              horse_id: runner.horse_id,
              number: runner.number,
              draw: runner.draw,
              horse: runner.horse,
              silk_url: runner.silk_url,
              sire: runner.sire,
              sire_region: runner.sire_region,
              dam: runner.dam,
              dam_region: runner.dam_region,
              form: runner.form,
              lbs: runner.lbs,
              headgear: runner.headgear,
              ofr: runner.ofr,
              ts: runner.ts,
              jockey: runner.jockey,
              trainer: runner.trainer,
              odds: runner.odds,
              is_non_runner: runner.is_non_runner || false
            });

          if (insertError) {
            console.error(`Error inserting new runner ${runner.horse_id}:`, insertError);
            continue;
          }

          console.log(`Successfully inserted new runner: ${runner.horse}`);
        }
      } catch (error) {
        console.error(`Error processing runner ${runner.horse_id}:`, error);
        continue;
      }
    }
  }

  console.log(`Processed ${validRunners.length} runners:`, {
    nonRunnerUpdates,
    oddsUpdates
  });

  return nonRunnerUpdates;
};