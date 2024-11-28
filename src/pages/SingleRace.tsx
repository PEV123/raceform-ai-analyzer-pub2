import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { formatInTimeZone } from 'date-fns-tz';
import { Tables } from "@/integrations/supabase/types";
import { ResultsTable } from "@/components/admin/horse-results/ResultsTable";

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

  // Fetch the specific race (Thurles 3:35 on 28th Nov 2024)
  const { data: race, isLoading } = useQuery({
    queryKey: ["single-race"],
    queryFn: async () => {
      const targetDate = new Date('2024-11-28T15:35:00Z'); // 3:35 PM UTC
      console.log("Fetching race for date:", targetDate);

      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          runners (*)
        `)
        .eq('course', 'Thurles')
        .gte('off_time', targetDate.toISOString())
        .lt('off_time', new Date(targetDate.getTime() + 60000).toISOString()) // Within 1 minute
        .single();

      if (error) {
        console.error("Error fetching race:", error);
        throw error;
      }
      
      console.log("Fetched race data:", data);
      return data as Race;
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!race) {
    return <div>Race not found</div>;
  }

  const formatDateTime = (date: string) => {
    return formatInTimeZone(
      new Date(date),
      settings?.timezone || 'Europe/London',
      'PPpp'
    );
  };

  const getHorseResults = (horseId: string) => {
    return historicalResults?.filter(result => result.horse_id === horseId) || [];
  };

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
        <h1 className="text-3xl font-bold">{race.course} - {formatDateTime(race.off_time)}</h1>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">{race.race_name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Class:</span> {race.race_class}</p>
                <p><span className="font-medium">Distance:</span> {race.distance}</p>
                <p><span className="font-medium">Going:</span> {race.going}</p>
              </div>
              <div>
                <p><span className="font-medium">Prize:</span> {race.prize}</p>
                <p><span className="font-medium">Age Band:</span> {race.age_band}</p>
                <p><span className="font-medium">Rating Band:</span> {race.rating_band}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {race.runners?.map((runner) => (
              <Card key={runner.id} className="p-4">
                <div className="flex items-start gap-4">
                  {runner.silk_url && (
                    <img
                      src={runner.silk_url}
                      alt={`${runner.jockey}'s silks`}
                      className="w-16 h-16 object-contain"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-lg font-bold">{runner.horse}</h3>
                      <span className="text-sm text-muted-foreground">
                        ({runner.age}yo {runner.sex})
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {runner.jockey} • {runner.trainer}
                    </p>
                    <div className="text-sm">
                      <p><span className="font-medium">Weight:</span> {runner.lbs}lbs</p>
                      <p><span className="font-medium">Draw:</span> {runner.draw}</p>
                      {runner.ofr && (
                        <p><span className="font-medium">Official Rating:</span> {runner.ofr}</p>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Recent Form</h4>
                      <ResultsTable results={getHorseResults(runner.horse_id)} />
                    </div>

                    {runner.comment && (
                      <p className="mt-4 text-sm italic">{runner.comment}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SingleRace;