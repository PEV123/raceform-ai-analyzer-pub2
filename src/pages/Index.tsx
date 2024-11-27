import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Runner {
  horse_id: string;
  number: number;
  draw: number;
  horse: string;
  silk_url: string | null;
  sire: string;
  sire_region: string;
  dam: string;
  dam_region: string;
  form: string | null;
  lbs: number;
  headgear: string | null;
  ofr: string | null;
  ts: string | null;
  jockey: string;
  trainer: string;
}

interface Race {
  id: string;
  off_time: string;
  course: string;
  race_name: string;
  region: string;
  race_class: string;
  age_band: string;
  rating_band: string;
  prize: string;
  field_size: number;
  runners: Runner[];
}

const RaceCard = ({ race }: { race: Race }) => {
  const lbsToStone = (lbs: number) => {
    const stone = Math.floor(lbs / 14);
    const remainder = lbs % 14;
    return `${stone}-${remainder}`;
  };

  return (
    <Card className="p-6 mb-8">
      <div className="flex justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">
            {new Date(race.off_time).toLocaleTimeString()} {race.course}
          </h2>
          <h3 className="text-xl">{race.race_name}</h3>
        </div>
        <div className="text-right">
          <p className="text-sm">
            {race.region} | {race.race_class} | {race.age_band} | {race.rating_band}
          </p>
          <p className="text-sm">
            Prize {race.prize} - {race.field_size} run
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {race.runners.map((runner) => (
          <div
            key={runner.horse_id}
            className="flex items-center gap-4 p-4 bg-muted rounded-lg"
          >
            <div className="w-8 text-center">
              <div className="font-bold">{runner.number}</div>
              <div className="text-sm">({runner.draw})</div>
            </div>
            {runner.silk_url && (
              <img src={runner.silk_url} alt="Silk" className="w-12 h-12" />
            )}
            <div className="flex-1">
              <h4 className="font-bold">{runner.horse}</h4>
              <p className="text-sm">
                {runner.sire} ({runner.sire_region}) | {runner.dam} ({runner.dam_region})
              </p>
              <p className="text-sm">Form: {runner.form || 'N/A'}</p>
            </div>
            <div className="text-sm">
              <p>wgt: {lbsToStone(runner.lbs)}</p>
              <p>hg: {runner.headgear || 'None'}</p>
            </div>
            <div className="text-sm">
              <p>ofr: {runner.ofr || 'N/A'}</p>
              <p>ts: {runner.ts || 'N/A'}</p>
            </div>
            <div className="text-sm">
              <p>J: {runner.jockey}</p>
              <p>T: {runner.trainer}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const Index = () => {
  const { data: races, isLoading } = useQuery({
    queryKey: ["races"],
    queryFn: async () => {
      console.log("Fetching races...");
      const { data: racesData, error: racesError } = await supabase
        .from("races")
        .select("*")
        .order("off_time", { ascending: true });

      if (racesError) {
        console.error("Error fetching races:", racesError);
        throw racesError;
      }

      console.log("Fetched races:", racesData);

      const racesWithRunners = await Promise.all(
        racesData.map(async (race) => {
          const { data: runnersData, error: runnersError } = await supabase
            .from("runners")
            .select("*")
            .eq("race_id", race.id);

          if (runnersError) {
            console.error("Error fetching runners:", runnersError);
            throw runnersError;
          }

          console.log(`Fetched runners for race ${race.id}:`, runnersData);

          return {
            ...race,
            runners: runnersData || [],
          };
        })
      );

      return racesWithRunners;
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

  // Group races by venue
  const racesByVenue = races.reduce((acc, race) => {
    if (!acc[race.course]) {
      acc[race.course] = [];
    }
    acc[race.course].push(race);
    return acc;
  }, {} as Record<string, Race[]>);

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
              <RaceCard key={race.id} race={race} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Index;