import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const processRaceBatch = async (
  races: any[],
  supabase: any,
  stats: any,
  jobId: string
) => {
  console.log(`Processing batch of ${races.length} races`);
  
  for (const race of races) {
    try {
      console.log(`Processing race at ${race.course}`);
      
      // Check if race already exists using race_id
      const { data: existingRace, error: checkError } = await supabase
        .from("races")
        .select("id, race_id")
        .eq("race_id", race.race_id)
        .single();

      if (checkError && !checkError.message.includes('No rows found')) {
        console.error(`Error checking existing race:`, checkError);
        stats.failedRaces++;
        continue;
      }

      if (existingRace) {
        console.log(`Race ${race.race_id} already exists, skipping`);
        continue;
      }

      // Prepare race data - ensure off_time is properly formatted
      const raceData = {
        off_time: race.off_dt || race.off_time,
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
        big_race: race.big_race || false,
        is_abandoned: race.is_abandoned || false
      };

      console.log('Inserting race with data:', raceData);

      // Insert race
      const { data: insertedRace, error: insertError } = await supabase
        .from("races")
        .insert(raceData)
        .select()
        .single();

      if (insertError) {
        console.error(`Error inserting race ${race.race_id}:`, insertError);
        stats.failedRaces++;
        continue;
      }
      
      stats.successfulRaces++;
      console.log(`Successfully inserted race: ${insertedRace.id}`);

      // Process runners if available
      if (race.runners?.length > 0) {
        console.log(`Processing ${race.runners.length} runners for race ${insertedRace.id}`);
        
        for (const runner of race.runners) {
          try {
            if (!runner.horse_id || !runner.horse) {
              console.warn(`Invalid runner data for race ${race.race_id}:`, runner);
              continue;
            }

            const runnerData = {
              race_id: insertedRace.id,
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
            };

            const { error: runnerError } = await supabase
              .from("runners")
              .insert(runnerData);

            if (runnerError) {
              console.error(`Error inserting runner ${runner.horse_id}:`, runnerError);
              continue;
            }

            console.log(`Successfully inserted runner ${runner.horse_id}`);
          } catch (runnerError) {
            console.error(`Error processing runner ${runner.horse_id}:`, runnerError);
          }
        }
      }

    } catch (error) {
      console.error(`Error processing race:`, error);
      stats.failedRaces++;
    }
  }
};