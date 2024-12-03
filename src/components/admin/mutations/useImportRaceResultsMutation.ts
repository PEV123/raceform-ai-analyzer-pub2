import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImportableRace {
  id: string;
  race_id: string | null;
  course: string;
  off_time: string;
  runners?: Array<{
    horse_id: string;
    horse: string;
  }>;
}

interface FetchRaceResultsResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const useImportRaceResultsMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (race: ImportableRace) => {
      console.log('Starting race results import for:', {
        raceId: race.id,
        raceApiId: race.race_id,
        course: race.course,
        time: race.off_time,
        runners: race.runners?.length
      });

      if (!race.race_id) {
        console.error('No race_id found for race:', race);
        throw new Error('Race ID is required for importing results');
      }

      const { data, error: importError } = await supabase
        .functions.invoke<FetchRaceResultsResponse>('fetch-race-results', {
          body: { raceId: race.race_id }
        });

      if (importError) {
        console.error('Error importing race results:', importError);
        throw importError;
      }

      console.log('Successfully imported race results:', data);

      // Move race to historical races
      const { error: moveError } = await supabase
        .rpc('move_race_to_historical', {
          p_race_id: race.id
        });

      if (moveError) {
        console.error('Error moving race to historical:', moveError);
        throw moveError;
      }

      console.log('Successfully moved race to historical races:', {
        raceId: race.id,
        raceApiId: race.race_id,
        course: race.course
      });
      
      return race;
    },
    onSuccess: (race) => {
      toast({
        title: "Success",
        description: `Results imported for race at ${race.course}`,
      });
      queryClient.invalidateQueries({ queryKey: ["races"] });
    },
    onError: (error) => {
      console.error('Race results import error:', error);
      toast({
        title: "Error",
        description: "Failed to import race results",
        variant: "destructive",
      });
    },
  });
};