import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RaceCard } from "@/components/race/RaceCard";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const { data: races, isLoading } = useQuery({
    queryKey: ["races"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          runners (*)
        `)
        .order('off_time', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!races?.length) return <div>No races found</div>;

  // Group races by date and venue
  const groupedRaces = races.reduce((acc: Record<string, Record<string, any[]>>, race) => {
    const date = format(new Date(race.off_time), 'yyyy-MM-dd');
    const venue = race.course;
    
    if (!acc[date]) {
      acc[date] = {};
    }
    if (!acc[date][venue]) {
      acc[date][venue] = [];
    }
    
    acc[date][venue].push(race);
    return acc;
  }, {});

  // Get unique venues across all dates
  const allVenues = Array.from(
    new Set(races.map(race => race.course))
  ).sort();

  return (
    <div className="space-y-8">
      {Object.entries(groupedRaces).map(([date, venues]) => (
        <div key={date} className="space-y-6">
          <h2 className="text-2xl font-bold">
            {format(new Date(date), 'EEEE, MMMM do, yyyy')}
          </h2>
          
          <Tabs defaultValue={allVenues[0]} className="w-full">
            <TabsList className="w-full justify-start">
              {allVenues.map(venue => (
                venues[venue] && (
                  <TabsTrigger 
                    key={venue} 
                    value={venue}
                    className="px-4 py-2"
                  >
                    {venue}
                  </TabsTrigger>
                )
              ))}
            </TabsList>

            {allVenues.map(venue => (
              venues[venue] && (
                <TabsContent key={venue} value={venue} className="space-y-4">
                  {venues[venue]?.map((race: any) => (
                    <RaceCard key={race.id} race={race} />
                  ))}
                </TabsContent>
              )
            ))}
          </Tabs>
        </div>
      ))}
    </div>
  );
};

export default Index;