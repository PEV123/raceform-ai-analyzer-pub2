import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { formatInTimeZone } from 'date-fns-tz';

export const useClearRacesMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: Date) => {
      console.log("Clearing races for date:", formatInTimeZone(date, 'Europe/London', 'yyyy-MM-dd'));
      
      // Get the start and end of the selected date in UK timezone
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // First, get all races for the selected date
      const { data: races, error: racesError } = await supabase
        .from("races")
        .select("id")
        .gte('off_time', startOfDay.toISOString())
        .lte('off_time', endOfDay.toISOString());

      if (racesError) {
        console.error("Error fetching races:", racesError);
        throw racesError;
      }

      if (!races || races.length === 0) {
        console.log("No races found for the selected date");
        return;
      }

      const raceIds = races.map(race => race.id);
      console.log(`Found ${raceIds.length} races to clear`);
      
      // First, delete all race chats for these races
      const { error: chatsError } = await supabase
        .from("race_chats")
        .delete()
        .in("race_id", raceIds);
      
      if (chatsError) {
        console.error("Error clearing race chats:", chatsError);
        throw chatsError;
      }
      console.log("Successfully cleared race chats");

      // Then, delete all race documents for these races
      const { error: docsError } = await supabase
        .from("race_documents")
        .delete()
        .in("race_id", raceIds);
      
      if (docsError) {
        console.error("Error clearing race documents:", docsError);
        throw docsError;
      }
      console.log("Successfully cleared race documents");

      // Then, delete all runners for these races
      const { error: runnersError } = await supabase
        .from("runners")
        .delete()
        .in("race_id", raceIds);
      
      if (runnersError) {
        console.error("Error clearing runners:", runnersError);
        throw runnersError;
      }
      console.log("Successfully cleared runners");

      // Finally, delete the races themselves
      const { error: deleteRacesError } = await supabase
        .from("races")
        .delete()
        .in("id", raceIds);
      
      if (deleteRacesError) {
        console.error("Error clearing races:", deleteRacesError);
        throw deleteRacesError;
      }
      console.log("Successfully cleared races");

      return formatInTimeZone(date, 'Europe/London', 'MMMM do, yyyy');
    },
    onSuccess: (formattedDate) => {
      toast({
        title: "Success",
        description: `All races for ${formattedDate} have been cleared`,
      });
      queryClient.invalidateQueries({ queryKey: ["races"] });
    },
    onError: (error) => {
      console.error("Error clearing races:", error);
      toast({
        title: "Error",
        description: "Failed to clear races. Please try again.",
        variant: "destructive",
      });
    },
  });
};