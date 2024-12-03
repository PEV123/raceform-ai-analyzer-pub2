import { supabase } from "@/integrations/supabase/client";
import { processRunners } from "./runnerProcessing";

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

export { processRunners };