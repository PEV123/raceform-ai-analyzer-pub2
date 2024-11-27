import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RaceCard } from "@/components/race/RaceCard";
import { formatInTimeZone } from 'date-fns-tz';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { format } from "date-fns";

const Index = () => {
  const [date, setDate] = useState<Date>(new Date());

  // First fetch admin settings for timezone display
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const timezone = settings?.timezone || 'Europe/London';

  // Then fetch races using the exact date without timezone manipulation
  const { data: races, isLoading: racesLoading } = useQuery({
    queryKey: ["races", date.toISOString()],
    queryFn: async () => {
      // Create date range for the selected day in UTC
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      
      console.log("Selected date:", format(date, 'yyyy-MM-dd'));
      console.log("Query date range (UTC):");
      console.log("Start:", startOfDay.toISOString());
      console.log("End:", endOfDay.toISOString());

      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          runners (*)
        `)
        .gte('off_time', startOfDay.toISOString())
        .lte('off_time', endOfDay.toISOString())
        .order('off_time', { ascending: true });

      if (error) throw error;
      console.log("Fetched races:", data);
      return data;
    },
  });

  if (racesLoading || settingsLoading) return <div>Loading...</div>;

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

  // Format the display date
  const displayDate = format(date, 'MMMM do, yyyy');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Today's Races</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {displayDate}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
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