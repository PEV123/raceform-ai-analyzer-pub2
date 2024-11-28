import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Runner = Tables<"runners">;

export const useImportHorseResultsMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (runners: Runner[]) => {
      console.log("Starting horse results import for runners:", runners.length);
      const results = [];
      
      for (const runner of runners) {
        if (!runner.horse_id) {
          console.warn("Skipping runner without horse_id:", runner);
          continue;
        }

        console.log(`Fetching results for horse ${runner.horse} (${runner.horse_id})`);
        
        try {
          const { data: apiData, error: apiError } = await supabase.functions.invoke('fetch-horse-results', {
            body: { horseId: runner.horse_id },
          });

          if (apiError) {
            console.error(`Error fetching results for horse ${runner.horse_id}:`, apiError);
            throw apiError;
          }

          console.log(`Successfully fetched results for horse ${runner.horse_id}:`, apiData);

          // Store results in the database
          if (apiData?.results?.length > 0) {
            const formattedResults = apiData.results.map((result: any) => ({
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
              comment: result.comment,
            }));

            const { error: insertError } = await supabase
              .from('horse_results')
              .upsert(formattedResults, {
                onConflict: 'horse_id,race_id',
              });

            if (insertError) {
              console.error(`Error storing results for horse ${runner.horse_id}:`, insertError);
              throw insertError;
            }

            results.push(...formattedResults);
            console.log(`Stored ${formattedResults.length} results for horse ${runner.horse_id}`);
          }
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
        description: "Horse results have been imported successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["races"] });
      queryClient.invalidateQueries({ queryKey: ["historical-results"] });
    },
    onError: (error: Error) => {
      console.error("Error importing horse results:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to import horse results. Please try again.",
        variant: "destructive",
      });
    },
  });
};