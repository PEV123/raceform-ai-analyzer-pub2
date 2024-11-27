import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RaceCard } from "@/components/race/RaceCard";
import { format } from "date-fns";

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

  // Group races by date and then by venue
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

  return (
    <div className="space-y-8">
      {Object.entries(groupedRaces).map(([date, venues]) => (
        <div key={date} className="space-y-6">
          <h2 className="text-2xl font-bold">
            {format(new Date(date), 'EEEE, MMMM do, yyyy')}
          </h2>
          
          {Object.entries(venues).map(([venue, venueRaces]) => (
            <div key={venue} className="space-y-4">
              <h3 className="text-xl font-semibold text-muted-foreground">{venue}</h3>
              <div className="space-y-4">
                {venueRaces.map((race) => (
                  <RaceCard key={race.id} race={race} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Index;