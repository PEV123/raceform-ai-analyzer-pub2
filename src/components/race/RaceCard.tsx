import { Card } from "@/components/ui/card";
import { OddsDisplay } from "./OddsDisplay";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from 'date-fns-tz';

interface RaceCardProps {
  race: any;
}

export const RaceCard = ({ race }: RaceCardProps) => {
  // Fetch settings for timezone
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

  // Fetch historical results for all runners in this race
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
      
      console.log('Fetched historical results:', data);
      return data;
    }
  });

  const getHorseResults = (horseId: string) => {
    const results = historicalResults?.filter(result => result.horse_id === horseId) || [];
    console.log(`Results for horse ${horseId}:`, results);
    return results;
  };

  const formatResult = (result: any) => {
    if (!result) return '';
    return `${result.position || '-'}/${result.course} (${result.distance || '-'}) ${result.going || '-'}`;
  };

  const timezone = settings?.timezone || 'Europe/London';

  // Format the race time in the correct timezone
  const raceTime = formatInTimeZone(
    new Date(race.off_time),
    timezone,
    'HH:mm'
  );

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
              <div className="flex gap-4">
                {runner.silk_url && (
                  <img
                    src={runner.silk_url}
                    alt={`${runner.jockey}'s silks`}
                    className="w-12 h-12 object-contain"
                  />
                )}
                <div>
                  <h4 className="text-lg font-semibold">{runner.horse}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {runner.jockey} - {runner.trainer}
                  </p>
                  
                  {/* Recent Form Section */}
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Recent Form:</p>
                    <div className="space-y-1">
                      {getHorseResults(runner.horse_id)
                        .slice(0, 3)
                        .map((result: any, index: number) => (
                          <p key={index} className="text-sm text-muted-foreground">
                            {formatResult(result)}
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground">Best:</span>
                    <OddsDisplay odds={runner.odds} type="best" />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground">Gen:</span>
                    <OddsDisplay odds={runner.odds} type="general" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};