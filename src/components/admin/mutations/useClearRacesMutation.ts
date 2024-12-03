import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatInTimeZone } from 'date-fns-tz';
import { clearRaces, clearRaceChats, clearRaceDocuments, clearRunners, getRacesForDate } from "./utils/clearRacesUtils";

export const useClearRacesMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: Date) => {
      // Format the date in UK timezone
      const ukDate = formatInTimeZone(date, 'Europe/London', 'yyyy-MM-dd');
      console.log("Clearing races for UK date:", ukDate);
      
      // Create start and end timestamps for the full UK day
      const ukStartOfDay = `${ukDate}T00:00:00.000Z`;
      const ukEndOfDay = `${ukDate}T23:59:59.999Z`;
      
      console.log('UK time range for clearing races:', {
        start: ukStartOfDay,
        end: ukEndOfDay
      });

      // Get all races for the selected date
      const raceIds = await getRacesForDate(ukStartOfDay, ukEndOfDay);

      if (raceIds.length === 0) {
        console.log("No races found to clear");
        return formatInTimeZone(date, 'Europe/London', 'MMMM do, yyyy');
      }

      console.log(`Found ${raceIds.length} races to clear`);

      // Delete related data in correct order
      await clearRaceChats(raceIds);
      await clearRaceDocuments(raceIds);
      await clearRunners(raceIds);
      await clearRaces(raceIds);

      return formatInTimeZone(date, 'Europe/London', 'MMMM do, yyyy');
    },
    onSuccess: (formattedDate) => {
      toast({
        title: "Success",
        description: `All races for ${formattedDate} have been cleared`,
      });
      queryClient.invalidateQueries({ queryKey: ["races"] });
    },
    onError: (error: Error) => {
      console.error("Error clearing races:", error);
      toast({
        title: "Error",
        description: "Failed to clear races. Please try again.",
        variant: "destructive",
      });
    },
  });
};