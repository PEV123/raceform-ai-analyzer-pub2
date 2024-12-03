import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Race } from "./types/raceResults";
import { importRaceResults } from "./services/raceResultsService";

export const useImportRaceResultsMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importRaceResults,
    onSuccess: (race) => {
      toast({
        title: "Success",
        description: `Results imported for race at ${race.course}`,
      });
      queryClient.invalidateQueries({ queryKey: ["races"] });
    },
    onError: (error: Error) => {
      console.error('Race results import error:', error);
      toast({
        title: "Error",
        description: "Failed to import race results",
        variant: "destructive",
      });
    },
  });
};