import { Card } from "@/components/ui/card";
import { OddsDisplay } from "./OddsDisplay";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface RaceCardProps {
  race: any;
}

export const RaceCard = ({ race }: RaceCardProps) => {
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

      if (error) throw error;
      return data;
    }
  });

  const getHorseResults = (horseId: string) => {
    return historicalResults?.filter(result => result.horse_id === horseId) || [];
  };

  const formatResult = (result: any) => {
    const position = result.position || '-';
    const runnerCount = result.winner && result.second && result.third ? '3+' : '-';
    return `${position}/${runnerCount} - ${result.course} (${result.distance || '-'}) - ${result.going || '-'}`;
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{race.race_name}</h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(race.off_time), 'HH:mm')}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {race.distance} - {race.going}
        </p>
      </div>

      <div className="space-y-4">
        {race.runners?.map((runner: any) => (
          <div key={runner.horse_id} className="border-t pt-4">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                {runner.silk_url && (
                  <img
                    src={runner.silk_url}
                    alt={`${runner.jockey}'s silks`}
                    className="w-8 h-8 object-contain"
                  />
                )}
                <div>
                  <h4 className="font-medium">{runner.horse}</h4>
                  <p className="text-sm text-muted-foreground">
                    {runner.jockey} - {runner.trainer}
                  </p>
                  
                  {/* Historical Results */}
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium">Recent Form:</p>
                    {getHorseResults(runner.horse_id)
                      .slice(0, 3)
                      .map((result: any, index: number) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          {formatResult(result)}
                          {result.comment && (
                            <span className="block text-xs italic mt-1">
                              {result.comment}
                            </span>
                          )}
                        </p>
                      ))}
                  </div>
                </div>
              </div>
              
              <OddsDisplay odds={runner.odds} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};