import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { processRace, processRunners } from "@/services/race";
import { supabase } from "@/integrations/supabase/client";

export const useImportRacesMutation = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (races: any[]) => {
      for (const race of races) {
        const processedRace = await processRace(race);
        await processRunners(processedRace.id, race.runners);
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
