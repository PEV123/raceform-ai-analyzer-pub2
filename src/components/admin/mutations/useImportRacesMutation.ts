import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { processRace, processRunners } from "@/services/race";
import { supabase } from "@/integrations/supabase/client";

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
      
      const { data: races, error: fetchError } = await supabase
        .from("races")
        .select("*")
        .eq("date", date.toISOString().split('T')[0]);

      if (fetchError) {
        console.error("Error fetching races:", fetchError);
        throw fetchError;
      }

      for (const race of races) {
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