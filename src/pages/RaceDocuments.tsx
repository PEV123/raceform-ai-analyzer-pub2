import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RaceList } from "@/components/admin/RaceList";
import { formatInTimeZone } from 'date-fns-tz';
import { useState } from "react";
import { DateSelector } from "@/components/race/DateSelector";

const RaceDocuments = () => {
  const today = formatInTimeZone(new Date(), 'Europe/London', 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const { data: races, isLoading } = useQuery({
    queryKey: ["races", selectedDate],
    queryFn: async () => {
      // Format dates in UK timezone for database query
      const start = `${selectedDate}T00:00:00.000Z`;
      const end = `${selectedDate}T23:59:59.999Z`;
      
      console.log('Fetching races between (UK time):', start, 'and', end);

      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          race_documents (*),
          runners (*)
        `)
        .gte('off_time', start)
        .lt('off_time', end)
        .order('off_time', { ascending: true });

      if (error) {
        console.error('Error fetching races:', error);
        throw error;
      }
      
      console.log('Successfully fetched races:', data);
      return data;
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Race Documents</h1>
        <DateSelector 
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Race Documents</h2>
        {isLoading ? (
          <p>Loading races...</p>
        ) : !races?.length ? (
          <p>No races found for this date.</p>
        ) : (
          <RaceList races={races} />
        )}
      </Card>
    </div>
  );
};

export default RaceDocuments;