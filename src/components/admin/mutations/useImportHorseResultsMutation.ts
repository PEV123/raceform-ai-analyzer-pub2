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
      
      for (const runner of runners) {
        if (!runner.horse_id) {
          console.warn("Skipping runner without horse_id:", runner);
          continue;
        }

        console.log(`Fetching results for horse ${runner.horse} (${runner.horse_id})`);
        
        try {
          const { data, error } = await supabase.functions.invoke('fetch-horse-results', {
            body: { horseId: runner.horse_id },
          });

          if (error) {
            console.error(`Error fetching results for horse ${runner.horse_id}:`, error);
            throw error;
          }

          console.log(`Successfully fetched results for horse ${runner.horse_id}:`, data);
        } catch (error) {
          console.error(`Failed to process horse ${runner.horse_id}:`, error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Horse results have been imported successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["races"] });
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