import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { RaceNavigation } from "@/components/race/RaceNavigation";
import { RaceDetails } from "@/components/race/RaceDetails";

type Race = Tables<"races"> & {
  runners: Tables<"runners">[];
};

const SingleRace = () => {
  const navigate = useNavigate();

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

  const { data: race, isLoading, error, refetch } = useQuery({
    queryKey: ["single-race"],
    enabled: false, // Don't fetch automatically
    queryFn: async ({ queryKey }) => {
      const [_, date, venue, time] = queryKey;
      if (!date || !venue || !time) return null;

      const targetDate = new Date(date);
      const [hours, minutes] = (time as string).split(':');
      targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      console.log("Fetching race for:", targetDate, venue);

      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          runners (*)
        `)
        .eq('course', venue)
        .gte('off_time', targetDate.toISOString())
        .lt('off_time', new Date(targetDate.getTime() + 60000).toISOString())
        .maybeSingle();

      if (error) {
        console.error("Error fetching race:", error);
        throw error;
      }
      
      console.log("Fetched race data:", data);
      return data as Race | null;
    },
  });

  // Fetch historical results for all runners
  const { data: historicalResults } = useQuery({
    queryKey: ['historical-results', race?.id],
    enabled: !!race?.runners,
    queryFn: async () => {
      const horseIds = race?.runners.map(runner => runner.horse_id) || [];
      console.log("Fetching historical results for horses:", horseIds);
      
      const { data, error } = await supabase
        .from('horse_results')
        .select('*')
        .in('horse_id', horseIds)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching horse results:', error);
        throw error;
      }
      
      console.log("Fetched historical results:", data);
      return data;
    }
  });

  const handleRaceSelect = (date: Date, venue: string, time: string) => {
    refetch({
      queryKey: ["single-race", date, venue, time]
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Race Finder</h1>
      </div>

      <RaceNavigation onRaceSelect={handleRaceSelect} />

      {error && (
        <div>Error loading race: {error.message}</div>
      )}

      {!race && !error && (
        <div>Please select a race using the navigation above.</div>
      )}

      {race && (
        <RaceDetails 
          race={race} 
          timezone={settings?.timezone || 'Europe/London'} 
          historicalResults={historicalResults || []} 
        />
      )}
    </div>
  );
};

export default SingleRace;