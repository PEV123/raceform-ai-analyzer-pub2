import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RaceCard } from "@/components/race/RaceCard";
import { DateSelector } from "@/components/race/DateSelector";
import { formatInTimeZone } from 'date-fns-tz';
import { useState } from "react";

const Index = () => {
  // Initialize with today's date in UK timezone
  const today = formatInTimeZone(new Date(), 'Europe/London', 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Fetch races for the selected date
  const { data: races, isLoading: racesLoading } = useQuery({
    queryKey: ["races", selectedDate],
    queryFn: async () => {
      // Use the selected date to create UK timezone range
      const startTime = `${selectedDate}T00:00:00.000Z`;
      const endTime = `${selectedDate}T23:59:59.999Z`;

      console.log("Fetching races between:", startTime, "and", endTime);

      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          runners (*)
        `)
        .gte('off_time', startTime)
        .lt('off_time', endTime)
        .order('off_time', { ascending: true });

      if (error) throw error;
      console.log("Fetched races:", data);
      return data;
    },
  });

  if (racesLoading) return <div>Loading...</div>;

  // Group races by venue
  const groupedRaces = races?.reduce((acc: Record<string, any[]>, race) => {
    const venue = race.course;
    if (!acc[venue]) {
      acc[venue] = [];
    }
    acc[venue].push(race);
    return acc;
  }, {}) || {};

  // Get unique venues
  const allVenues = Object.keys(groupedRaces).sort();

  // Format the display date in UK timezone
  const displayDate = formatInTimeZone(new Date(selectedDate), 'Europe/London', 'MMMM do, yyyy');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Today's Races</h1>
        <DateSelector 
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>

      {!races?.length ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No races found for {displayDate}.</p>
        </div>
      ) : (
        <Tabs defaultValue={allVenues[0]} className="w-full">
          <TabsList className="w-full justify-start">
            {allVenues.map(venue => (
              <TabsTrigger 
                key={venue} 
                value={venue}
                className="px-4 py-2"
              >
                {venue}
              </TabsTrigger>
            ))}
          </TabsList>

          {allVenues.map(venue => (
            <TabsContent key={venue} value={venue} className="space-y-4">
              {groupedRaces[venue]?.map((race: any) => (
                <RaceCard key={race.id} race={race} />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default Index;