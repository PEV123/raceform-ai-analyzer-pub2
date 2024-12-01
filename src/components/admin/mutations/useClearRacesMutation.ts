import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { formatInTimeZone } from 'date-fns-tz';
import { 
  getRacesForDate,
  clearRaceChats,
  clearRaceDocuments,
  clearRunners,
  clearRaces
} from './utils/clearRacesUtils';

export const useClearRacesMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: Date) => {
      console.log("Clearing races for UK date:", formatInTimeZone(date, 'Europe/London', 'yyyy-MM-dd'));
      
      // Get the start and end of the selected date in UK timezone
      const ukStartOfDay = new Date(formatInTimeZone(date, 'Europe/London', 'yyyy-MM-dd 00:00:00'));
      const ukEndOfDay = new Date(formatInTimeZone(date, 'Europe/London', 'yyyy-MM-dd 23:59:59.999'));
      
      // Get all races for the selected date
      const raceIds = await getRacesForDate(ukStartOfDay, ukEndOfDay);
      
      if (raceIds.length === 0) {
        return formatInTimeZone(date, 'Europe/London', 'MMMM do, yyyy');
      }

      console.log(`Found ${raceIds.length} races to clear`);
      
      // Clear all related data
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