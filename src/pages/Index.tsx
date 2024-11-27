import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RaceCard } from "@/components/race/RaceCard";
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

  // Fetch races for the selected date
  const { data: races, isLoading: racesLoading } = useQuery({
    queryKey: ["races", format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const selectedDate = format(date, 'yyyy-MM-dd');
      console.log("Fetching races for date:", selectedDate);

      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          runners (*)
        `)
        .gte('off_time', `${selectedDate}T00:00:00`)
        .lt('off_time', `${selectedDate}T23:59:59.999`)
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