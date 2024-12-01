import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchRacesForDate } from "@/services/racingApi";
import { processRace, processRunners } from "@/services/raceProcessing";

interface ImportProgress {
  onProgress: (progress: number, operation: string) => void;
}

interface ImportParams extends ImportProgress {
  date: Date;
}

export const useImportRacesMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ date, onProgress }: ImportParams) => {
      console.log('Starting full import process for date:', date);
      
      // Step 1: Fetch and import races
      onProgress(0, "Fetching races from API...");
      const races = await fetchRacesForDate(date);
      console.log('Fetched races:', races);

      const totalOperations = races.length * 3; // One for each main operation per race
      let completedOperations = 0;

      for (const race of races) {
        try {
          // Process race data
          onProgress(
            (completedOperations / totalOperations) * 100,
            `Processing race at ${race.course} (${race.off_time})`
          );
          
          const raceData = await processRace(race);
          if (!raceData) {
            console.log(`Race ${race.race_id} already exists, skipping`);
            continue;
          }
          
          // Process runners
          if (race.runners && Array.isArray(race.runners)) {
            await processRunners(raceData.id, race.runners);
            
            // Step 2: Import horse results for each runner
            onProgress(
              ((completedOperations + 1) / totalOperations) * 100,
              `Importing results for horses at ${race.course}`
            );
            
            for (const runner of race.runners) {
              if (!runner.horse_id) continue;
              
              // Fetch and store horse results
              const { data: resultsData } = await supabase.functions.invoke('fetch-horse-results', {
                body: { horseId: runner.horse_id }
              });
              
              if (resultsData?.results) {
                for (const result of resultsData.results) {
                  await supabase
                    .from('horse_results')
                    .upsert({
                      horse_id: runner.horse_id,
                      race_id: result.race_id,
                      date: result.date,
                      course: result.course,
                      distance: result.distance,
                      class: result.class,
                      going: result.going,
                      position: result.position,
                      weight_lbs: result.weight_lbs,
                      winner: result.winner,
                      second: result.second,
                      third: result.third,
                      winner_weight_lbs: result.winner_weight_lbs,
                      second_weight_lbs: result.second_weight_lbs,
                      third_weight_lbs: result.third_weight_lbs,
                      winner_btn: result.winner_btn,
                      second_btn: result.second_btn,
                      third_btn: result.third_btn,
                      comment: result.comment
                    }, {
                      onConflict: 'horse_id,race_id'
                    });
                }
              }
            }
            
            // Step 3: Import distance analysis for each runner
            onProgress(
              ((completedOperations + 2) / totalOperations) * 100,
              `Importing distance analysis for horses at ${race.course}`
            );
            
            for (const runner of race.runners) {
              if (!runner.horse_id) continue;
              
              // Fetch and store distance analysis
              const { data: analysisData } = await supabase.functions.invoke('fetch-horse-results', {
                body: { 
                  horseId: runner.horse_id,
                  type: 'distance-analysis'
                }
              });
              
              if (analysisData && analysisData.id) {
                // Store the main analysis record
                const { data: analysis } = await supabase
                  .from('horse_distance_analysis')
                  .upsert({
                    horse_id: analysisData.id,
                    horse: analysisData.horse,
                    sire: analysisData.sire,
                    sire_id: analysisData.sire_id,
                    dam: analysisData.dam,
                    dam_id: analysisData.dam_id,
                    damsire: analysisData.damsire,
                    damsire_id: analysisData.damsire_id,
                    total_runs: analysisData.total_runs
                  })
                  .select()
                  .single();

                if (analysis && analysisData.distances) {
                  for (const distance of analysisData.distances) {
                    // Store distance details
                    const { data: distanceDetail } = await supabase
                      .from('horse_distance_details')
                      .upsert({
                        analysis_id: analysis.id,
                        dist: distance.dist,
                        dist_y: distance.dist_y,
                        dist_m: distance.dist_m,
                        dist_f: distance.dist_f,
                        runs: distance.runs,
                        wins: distance['1st'],
                        second_places: distance['2nd'],
                        third_places: distance['3rd'],
                        fourth_places: distance['4th'],
                        ae_index: distance['a/e'],
                        win_percentage: distance['win_%'],
                        place_index: distance['1_pl']
                      })
                      .select()
                      .single();

                    // Store times for this distance
                    if (distanceDetail && distance.times) {
                      for (const time of distance.times) {
                        await supabase
                          .from('horse_distance_times')
                          .upsert({
                            distance_detail_id: distanceDetail.id,
                            date: time.date,
                            region: time.region,
                            course: time.course,
                            time: time.time,
                            going: time.going,
                            position: time.position
                          });
                      }
                    }
                  }
                }
              }
            }
          }
          
          completedOperations += 3; // Increment for all three operations completed for this race
        } catch (error) {
          console.error(`Error processing race ${race.race_id}:`, error);
          throw error;
        }
      }

      onProgress(100, "Import completed successfully!");
      return races;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
      toast({
        title: "Success",
        description: "All race data imported successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Error in mutation:', error);
      toast({
        title: "Error",
        description: "Failed to import races: " + error.message,
        variant: "destructive",
      });
    },
  });
};