import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from 'date-fns-tz';
import { DetailedHorseForm } from "./DetailedHorseForm";
import { RaceDistanceComparison } from "./RaceDistanceComparison";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { RaceHeader } from "./RaceHeader";
import { RunnersList } from "./RunnersList";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { RaceResults } from "./RaceResults";

interface RaceCardProps {
  race: any;
}

export const RaceCard = ({ race }: RaceCardProps) => {
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

  // Sort runners by number
  const sortedRunners = [...(race.runners || [])].sort((a, b) => a.number - b.number);

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
        <div className="flex justify-between items-center">
          <RaceHeader race={race} raceTime={raceTime} />
          <Button 
            variant="outline"
            onClick={() => navigate(`/public-analysis/${race.id}`)}
          >
            View AI Analysis
          </Button>
        </div>

        {raceResult && <RaceResults raceResult={raceResult} />}

        {distanceAnalyses?.length > 0 && (
          <div className="mb-6">
            <RaceDistanceComparison 
              analyses={distanceAnalyses} 
              runners={race.runners}
            />
          </div>
        )}

        <RunnersList runners={sortedRunners} />

        <div className="space-y-6">
          {sortedRunners.map((runner: any) => (
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
