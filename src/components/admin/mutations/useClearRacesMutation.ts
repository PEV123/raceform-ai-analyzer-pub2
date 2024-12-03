import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatInTimeZone } from 'date-fns-tz';

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
      const { data: races, error: fetchError } = await supabase
        .from("races")
        .select("id")
        .gte('off_time', ukStartOfDay)
        .lt('off_time', ukEndOfDay);

      if (fetchError) throw fetchError;

      if (!races || races.length === 0) {
        console.log("No races found to clear");
        return formatInTimeZone(date, 'Europe/London', 'MMMM do, yyyy');
      }

      const raceIds = races.map(race => race.id);
      console.log(`Found ${raceIds.length} races to clear`);

      // Delete related data in correct order
      const operations = [
        { table: "race_chats", message: "Clearing race chats..." },
        { table: "race_documents", message: "Clearing race documents..." },
        { table: "odds_history", message: "Clearing odds history..." },
        { table: "runners", message: "Clearing runners..." },
        { table: "races", message: "Clearing races..." }
      ];

      for (const op of operations) {
        console.log(op.message);
        const { error } = await supabase
          .from(op.table)
          .delete()
          .in(op.table === "odds_history" ? "runner_id" : "race_id", 
              op.table === "odds_history" ? 
                (await supabase
                  .from("runners")
                  .select("id")
                  .in("race_id", raceIds)).data?.map(r => r.id) || [] 
                : raceIds
          );

        if (error) {
          console.error(`Error clearing ${op.table}:`, error);
          throw error;
        }
      }

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