import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Runner = Tables<"runners">;

export const useImportHorseDistanceAnalysisMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (runners: Runner[]) => {
      console.log("Starting horse distance analysis import for runners:", runners.length);
      const results = [];
      
      for (const runner of runners) {
        if (!runner.horse_id) {
          console.warn("Skipping runner without horse_id:", runner);
          continue;
        }

        console.log(`Fetching distance analysis for horse ${runner.horse} (${runner.horse_id})`);
        
        try {
          const { data: apiData, error: apiError } = await supabase.functions.invoke('fetch-horse-results', {
            body: { 
              horseId: runner.horse_id,
              type: 'distance-analysis'
            },
          });

          if (apiError) {
            console.error(`Error fetching analysis for horse ${runner.horse_id}:`, apiError);
            throw apiError;
          }

          console.log(`Successfully fetched analysis for horse ${runner.horse_id}:`, apiData);

          // Store the analysis in the database
          const { data: analysis, error: analysisError } = await supabase
            .from('horse_distance_analysis')
            .upsert({
              horse_id: apiData.id,
              horse: apiData.horse,
              sire: apiData.sire,
              sire_id: apiData.sire_id,
              dam: apiData.dam,
              dam_id: apiData.dam_id,
              damsire: apiData.damsire,
              damsire_id: apiData.damsire_id,
              total_runs: apiData.total_runs
            })
            .select()
            .single();

          if (analysisError) throw analysisError;

          // Store distance details and times
          for (const distance of apiData.distances) {
            const { data: distanceDetail, error: distanceError } = await supabase
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

            if (distanceError) throw distanceError;

            // Store times for this distance
            for (const time of distance.times) {
              const { error: timeError } = await supabase
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

              if (timeError) throw timeError;
            }
          }

          results.push(analysis);
          console.log(`Successfully stored analysis for horse ${runner.horse_id}`);

        } catch (error) {
          console.error(`Failed to process horse ${runner.horse_id}:`, error);
          throw error;
        }
      }

      return results;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Horse distance analysis has been imported successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["races"] });
    },
    onError: (error: Error) => {
      console.error("Error importing horse distance analysis:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to import horse distance analysis. Please try again.",
        variant: "destructive",
      });
    },
  });
};