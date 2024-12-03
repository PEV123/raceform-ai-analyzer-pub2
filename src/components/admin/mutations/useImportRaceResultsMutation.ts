import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Race = Tables<"races">;

interface RaceResults {
  results: any[];
  [key: string]: any;
}

interface MoveRaceParams {
  race_id: string;
}

export const useImportRaceResultsMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (race: Race) => {
      console.log("Starting race results import for:", race.course, race.off_time);
      
      try {
        // Fetch results from Racing API
        const { data: resultsData, error: apiError } = await supabase.functions.invoke<RaceResults>('fetch-race-results', {
          body: { raceId: race.race_id }
        });

        if (apiError) {
          console.error('Error fetching race results:', apiError);
          throw apiError;
        }

        if (!resultsData?.results) {
          console.warn('No results found for race:', race.id);
          return null;
        }

        console.log('Successfully fetched results:', resultsData);

        // Move race to historical tables with results
        const { error: moveError } = await supabase.rpc<MoveRaceParams, null>('move_race_to_historical', {
          race_id: race.id
        });

        if (moveError) {
          console.error('Error moving race to historical:', moveError);
          throw moveError;
        }

        return resultsData;
      } catch (error) {
        console.error('Error in race results import:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Race results have been imported successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["races"] });
    },
    onError: (error: Error) => {
      console.error("Error importing race results:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to import race results. Please try again.",
        variant: "destructive",
      });
    },
  });
};