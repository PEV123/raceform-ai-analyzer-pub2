import { supabase } from "@/integrations/supabase/client";
import { prepareRaceData } from "./raceDataPreparation";
import { processRunner } from "./runnerProcessing";

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
  supabaseClient: any,
  stats: ImportStats,
  jobId: string
) => {
  console.log(`Processing batch of ${races.length} races`);
  
  for (const race of races) {
    try {
      console.log(`Processing race at ${race.course}`);
      
      // Prepare race data
      const raceData = prepareRaceData(race, race.off_time);
      console.log('Prepared race data:', raceData);
      
      // Upsert race data - this will update if exists, insert if not
      const { data: upsertedRace, error: raceError } = await supabaseClient
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
              await processRunner(supabaseClient, upsertedRace.id, runner, stats);
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