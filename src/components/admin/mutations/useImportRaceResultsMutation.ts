import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Race = Tables<"races"> & {
  runners: Tables<"runners">[];
};

export const useImportRaceResultsMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (race: Race) => {
      console.log('Importing race results for:', race);

      const { data, error: importError } = await supabase
        .functions.invoke('fetch-race-results', {
          body: { raceId: race.id }
        });

      if (importError) {
        console.error('Error importing race results:', importError);
        throw importError;
      }

      console.log('Successfully imported race results:', data);

      // Move race to historical races
      const { error: moveError } = await supabase
        .rpc('move_race_to_historical', {
          race_id: race.id
        });

      if (moveError) {
        console.error('Error moving race to historical:', moveError);
        throw moveError;
      }

      console.log('Successfully moved race to historical');
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