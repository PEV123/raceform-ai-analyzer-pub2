import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { fetchRacesForDate } from "@/services/racingApi";
import { processRace, processRunners } from "@/services/raceProcessing";

export const useImportRacesMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (date: Date) => {
      console.log('Importing races for date:', date);
      const races = await fetchRacesForDate(date);
      console.log('Fetched races:', races);

      for (const race of races) {
        try {
          const raceData = await processRace(race);
          if (raceData) {
            await processRunners(raceData.id, race.runners);
          }
        } catch (error) {
          console.error('Error processing race:', error);
          throw error;
        }
      }

      return races;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
      toast({
        title: "Success",
        description: "Races imported successfully",
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