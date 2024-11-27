import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RaceCard } from "@/components/race/RaceCard";

const Index = () => {
  const { data: settings } = useQuery({
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

  const { data: races, isLoading } = useQuery({
    queryKey: ["races"],
    queryFn: async () => {
      console.log("Fetching races...");
      const { data: racesData, error: racesError } = await supabase
        .from("races")
        .select("*, runners(*)")
        .order("off_time", { ascending: true });

      if (racesError) {
        console.error("Error fetching races:", racesError);
        throw racesError;
      }

      console.log("Fetched races:", racesData);
      return racesData;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!races || races.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-lg text-muted-foreground">No races scheduled for today</p>
      </Card>
    );
  }

  // Create a Map to store unique races by their course and off_time combination
  const uniqueRaces = new Map();
  races.forEach(race => {
    const key = `${race.course}-${race.off_time}`;
    if (!uniqueRaces.has(key)) {
      uniqueRaces.set(key, race);
    }
  });

  // Convert the Map back to an array and sort by off_time
  const dedupedRaces = Array.from(uniqueRaces.values())
    .sort((a, b) => new Date(a.off_time).getTime() - new Date(b.off_time).getTime());

  // Group races by venue
  const racesByVenue = dedupedRaces.reduce((acc, race) => {
    if (!acc[race.course]) {
      acc[race.course] = [];
    }
    acc[race.course].push(race);
    return acc;
  }, {} as Record<string, typeof races>);

  const venues = Object.keys(racesByVenue).sort();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Today's Races</h1>
      <Tabs defaultValue={venues[0]} className="w-full">
        <TabsList className="mb-8 flex flex-wrap gap-2">
          {venues.map((venue) => (
            <TabsTrigger key={venue} value={venue} className="px-4 py-2">
              {venue} ({racesByVenue[venue].length})
            </TabsTrigger>
          ))}
        </TabsList>
        {venues.map((venue) => (
          <TabsContent key={venue} value={venue}>
            {racesByVenue[venue].map((race) => (
              <RaceCard 
                key={race.id} 
                race={race} 
                timezone={settings?.timezone || 'Europe/London'} 
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Index;