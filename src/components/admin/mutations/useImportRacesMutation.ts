import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchRacesForDate } from "@/services/racingApi";
import { processRace, processRunners } from "@/services/raceProcessing";
import { sleep } from "@/lib/utils";

interface ImportProgress {
  onProgress: (progress: number, operation: string) => void;
  onUpdateSummary?: (summary: any) => void;
}

interface ImportParams extends ImportProgress {
  date: Date;
}

export const useImportRacesMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ date, onProgress, onUpdateSummary }: ImportParams) => {
      console.log('Starting race update process for date:', date);
      
      const updateSummary = {
        nonRunnerUpdates: [] as any[],
        oddsUpdates: [] as any[]
      };
      
      onProgress(0, "Fetching latest race data...");
      const races = await fetchRacesForDate(date);
      console.log('Fetched races:', races);

      const totalOperations = races.length;
      let completedOperations = 0;

      for (const race of races) {
        try {
          // Check if race exists
          const { data: existingRace } = await supabase
            .from("races")
            .select("id")
            .eq("race_id", race.race_id)
            .single();

          if (!existingRace) {
            console.log(`Race ${race.race_id} doesn't exist, creating new race`);
            const raceData = await processRace(race);
            if (race.runners?.length) {
              await processRunners(raceData.id, race.runners);
            }
          } else {
            console.log(`Updating existing race ${race.race_id}`);
            // Only process runners to update non-runners and odds
            if (race.runners?.length) {
              const nonRunnerUpdates = await processRunners(existingRace.id, race.runners);
              
              if (nonRunnerUpdates > 0) {
                updateSummary.nonRunnerUpdates.push({
                  raceId: race.race_id,
                  course: race.course,
                  count: nonRunnerUpdates
                });
              }
            }
          }
          
          completedOperations++;
          onProgress(
            (completedOperations / totalOperations) * 100,
            `Updating race data for ${race.course} (${race.off_time})`
          );
          
          await sleep(1000);
        } catch (error) {
          console.error(`Error processing race ${race.race_id}:`, error);
          continue;
        }
      }

      if (onUpdateSummary) {
        onUpdateSummary(updateSummary);
      }

      onProgress(100, "Update completed successfully!");
      return races;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
      toast({
        title: "Success",
        description: "Race data updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Error in mutation:', error);
      toast({
        title: "Error",
        description: "Failed to update races: " + error.message,
        variant: "destructive",
      });
    },
  });
};