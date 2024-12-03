import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { processRace, processRunners } from "@/services/race";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from "date-fns-tz";

interface ImportRacesParams {
  date: Date;
  onProgress?: (progress: number, operation: string) => void;
  onUpdateSummary?: (summary: any) => void;
}

export const useImportRacesMutation = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ date, onProgress, onUpdateSummary }: ImportRacesParams) => {
      console.log('Importing races for date:', date);
      
      // Format the date range in UK timezone for consistency
      const ukDate = formatInTimeZone(date, 'Europe/London', 'yyyy-MM-dd');
      const startTime = `${ukDate}T00:00:00Z`;
      const endTime = `${ukDate}T23:59:59Z`;

      console.log('Fetching races between:', startTime, 'and', endTime);
      
      const { data: races, error: fetchError } = await supabase
        .from("races")
        .select("*")
        .gte("off_time", startTime)
        .lt("off_time", endTime);

      if (fetchError) {
        console.error("Error fetching races:", fetchError);
        throw fetchError;
      }

      console.log(`Processing ${races?.length || 0} races`);

      for (const race of races || []) {
        const processedRace = await processRace(race);
        
        // Fetch runners for this race
        const { data: runners, error: runnersError } = await supabase
          .from("runners")
          .select("*")
          .eq("race_id", race.id);

        if (runnersError) {
          console.error("Error fetching runners:", runnersError);
          throw runnersError;
        }

        await processRunners(processedRace.id, runners || []);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Races imported successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Error importing races:", error);
      toast({
        title: "Error",
        description: "Failed to import races. Please try again.",
        variant: "destructive",
      });
    },
  });
};