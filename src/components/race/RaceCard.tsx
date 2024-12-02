import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from 'date-fns-tz';
import { DetailedHorseForm } from "./DetailedHorseForm";
import { RaceDistanceComparison } from "./RaceDistanceComparison";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { OddsDisplay } from "./OddsDisplay";

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

  const { data: historicalResults, error: historicalError } = useQuery({
    queryKey: ['historical-results', race.id],
    queryFn: async () => {
      const horseIds = race.runners.map((runner: any) => runner.horse_id);
      
      const { data, error } = await supabase
        .from('horse_results')
        .select('*')
        .in('horse_id', horseIds)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching historical results:', error);
        throw error;
      }
      
      return data;
    },
    retry: 2
  });

  const { data: distanceAnalyses, error: analysesError } = useQuery({
    queryKey: ['distance-analyses', race.id],
    queryFn: async () => {
      const horseIds = race.runners.map((runner: any) => runner.horse_id);
      
      const { data, error } = await supabase
        .from('horse_distance_analysis')
        .select(`
          *,
          horse_distance_details (
            *,
            horse_distance_times (*)
          )
        `)
        .in('horse_id', horseIds);

      if (error) {
        console.error('Error fetching distance analyses:', error);
        throw error;
      }

      return data;
    },
    retry: 2
  });

  const getHorseResults = (horseId: string) => {
    return historicalResults?.filter(result => result.horse_id === horseId) || [];
  };

  const getHorseDistanceAnalysis = (horseId: string) => {
    return distanceAnalyses?.find(analysis => analysis.horse_id === horseId);
  };

  const timezone = settings?.timezone || 'Europe/London';
  const raceTime = formatInTimeZone(new Date(race.off_time), timezone, 'HH:mm');

  if (historicalError || analysesError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading race data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-6 mb-6">
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-bold">{race.race_name}</h3>
              <p className="text-lg">{race.course}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold">{raceTime}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
            <div>
              <p><span className="font-medium">Class:</span> {race.race_class}</p>
              <p><span className="font-medium">Age:</span> {race.age_band}</p>
            </div>
            <div>
              <p><span className="font-medium">Rating Band:</span> {race.rating_band}</p>
              <p><span className="font-medium">Prizemoney:</span> {race.prize}</p>
            </div>
            <div>
              <p><span className="font-medium">Going:</span> {race.going}</p>
              <p><span className="font-medium">Surface:</span> {race.surface}</p>
            </div>
            <div>
              <p><span className="font-medium">Type:</span> {race.type}</p>
              <p><span className="font-medium">Distance:</span> {race.distance}</p>
            </div>
          </div>
        </div>

        {distanceAnalyses?.length > 0 && (
          <div className="mb-6">
            <RaceDistanceComparison analyses={distanceAnalyses} />
          </div>
        )}

        <div className="space-y-4">
          {race.runners?.map((runner: any) => (
            <div 
              key={runner.horse_id}
              className={`p-2 bg-muted rounded-lg flex items-center gap-2 ${
                runner.is_non_runner ? 'opacity-50' : ''
              }`}
            >
              <div className="w-6 text-center font-bold">
                {runner.number}
                {runner.is_non_runner && (
                  <span className="text-xs text-red-500 block">NR</span>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {runner.horse}
                </div>
                <div className="text-sm text-muted-foreground">
                  {runner.jockey} | {runner.trainer}
                </div>
              </div>
              <OddsDisplay odds={runner.odds} />
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {race.runners?.map((runner: any) => (
            <DetailedHorseForm
              key={runner.horse_id}
              runner={runner}
              historicalResults={getHorseResults(runner.horse_id)}
              distanceAnalysis={getHorseDistanceAnalysis(runner.horse_id)}
              raceDistance={race.distance}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};