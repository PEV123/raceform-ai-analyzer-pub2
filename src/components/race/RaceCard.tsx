import { Card } from "@/components/ui/card";
import { OddsDisplay } from "./OddsDisplay";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    return `${result.position}/${result.runners?.length} - ${result.course} (${result.distance}) - ${result.going}`;
  };

  return (
    <Card className="p-4 mb-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{race.race_name}</h3>
        <p className="text-sm text-gray-600">
          {race.course} - {race.off_time} - {race.distance} - {race.going}
        </p>
      </div>

      <div className="space-y-4">
        {race.runners?.map((runner: any) => (
          <div key={runner.horse_id} className="border-t pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{runner.horse}</h4>
                <p className="text-sm text-gray-600">
                  {runner.jockey} - {runner.trainer}
                </p>
                
                {/* Historical Results */}
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium">Recent Form:</p>
                  {getHorseResults(runner.horse_id)
                    .slice(0, 3)
                    .map((result: any) => (
                      <p key={result.id} className="text-sm text-gray-600">
                        {new Date(result.date).toLocaleDateString()} - {formatResult(result)}
                        {result.comment && (
                          <span className="block text-xs italic mt-1">
                            {result.comment}
                          </span>
                        )}
                      </p>
                    ))}
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