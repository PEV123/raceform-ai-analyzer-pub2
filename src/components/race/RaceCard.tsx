import { Card } from "@/components/ui/card";
import { OddsDisplay } from "./OddsDisplay";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from 'date-fns-tz';
import { format } from 'date-fns';

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

  const formatRaceResult = (result: any) => {
    if (!result) return null;
    
    const position = result.position || '-';
    const course = result.course || '';
    const going = result.going ? `(${result.going})` : '';
    const date = result.date ? format(new Date(result.date), 'dd/MM/yy') : '';
    const distance = result.distance || '';
    const winner = result.winner;
    const second = result.second;
    const third = result.third;
    
    return {
      position,
      course,
      going,
      date,
      distance,
      winner,
      second,
      third,
      full: `${position}/${course} ${going} ${distance} ${date}`
    };
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
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Recent Form:</p>
                    <div className="space-y-4">
                      {getHorseResults(runner.horse_id)
                        .slice(0, 5)
                        .map((result: any, index: number) => {
                          const formattedResult = formatRaceResult(result);
                          if (!formattedResult) return null;
                          
                          return (
                            <div key={index} className="bg-muted p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{formattedResult.position}</span>
                                <span className="text-sm">
                                  {formattedResult.course} {formattedResult.going} {formattedResult.distance} {formattedResult.date}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">1st:</span> {formattedResult.winner}
                                {formattedResult.second && (
                                  <>
                                    <span className="font-medium ml-2">2nd:</span> {formattedResult.second}
                                  </>
                                )}
                                {formattedResult.third && (
                                  <>
                                    <span className="font-medium ml-2">3rd:</span> {formattedResult.third}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      {getHorseResults(runner.horse_id).length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No recent form available</p>
                      )}
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