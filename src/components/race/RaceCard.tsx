import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from 'date-fns-tz';
import { RunnerHeader } from "./RunnerHeader";
import { RunnerForm } from "./RunnerForm";
import { RunnerOdds } from "./RunnerOdds";

interface RaceCardProps {
  race: any;
}

export const RaceCard = ({ race }: RaceCardProps) => {
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

  const { data: historicalResults } = useQuery({
    queryKey: ['historical-results', race.id],
    queryFn: async () => {
      const horseIds = race.runners.map((runner: any) => runner.horse_id);
      
      const { data, error } = await supabase
        .from('horse_results')
        .select('*')
        .in('horse_id', horseIds)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching horse results:', error);
        throw error;
      }
      
      return data;
    }
  });

  const getHorseResults = (horseId: string) => {
    return historicalResults?.filter(result => result.horse_id === horseId) || [];
  };

  const timezone = settings?.timezone || 'Europe/London';
  const raceTime = formatInTimeZone(new Date(race.off_time), timezone, 'HH:mm');

  return (
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold mb-2">{race.race_name}</h3>
          <p className="text-sm text-muted-foreground">
            {race.distance} - {race.going}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{raceTime}</p>
        </div>
      </div>

      <div className="space-y-6">
        {race.runners?.map((runner: any) => (
          <div key={runner.horse_id} className="border-t pt-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <RunnerHeader 
                  runner={runner} 
                  silkUrl={runner.silk_url} 
                />
                
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Recent Form:</p>
                  <RunnerForm 
                    historicalResults={getHorseResults(runner.horse_id)} 
                  />
                </div>
              </div>
              
              <RunnerOdds odds={runner.odds} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};