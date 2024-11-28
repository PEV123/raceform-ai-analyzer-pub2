import { supabase } from "@/integrations/supabase/client";

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
    return;
  }

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
    })
    .map(runner => ({
      race_id: raceId,
      horse_id: runner.horse_id,
      number: Number(runner.number) || 0,
      draw: Number(runner.draw) || 0,
      horse: runner.horse,
      silk_url: runner.silk_url,
      sire: runner.sire,
      sire_region: runner.sire_region,
      dam: runner.dam,
      dam_region: runner.dam_region,
      form: runner.form,
      lbs: Number(runner.lbs) || 0,
      headgear: runner.headgear,
      ofr: runner.ofr,
      ts: runner.ts,
      jockey: runner.jockey || 'Unknown',
      trainer: runner.trainer,
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
      trainer_14_days: runner.trainer_14_days || [],
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
      trainer_rtf: runner.trainer_rtf,
      odds: runner.odds || [],
    }));

  if (validRunners.length > 0) {
    const { error: runnersError } = await supabase
      .from("runners")
      .insert(validRunners);

    if (runnersError) {
      console.error("Error inserting runners:", runnersError);
      throw runnersError;
    }
    console.log(`Successfully inserted ${validRunners.length} runners`);
  }
};
