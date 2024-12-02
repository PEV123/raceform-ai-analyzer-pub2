import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { OddsTable } from "./OddsTable";
import { HorseDistanceAnalysis } from "./HorseDistanceAnalysis";
import { RunnerHeader } from "./components/RunnerHeader";
import { RunnerDetails } from "./components/RunnerDetails";

type Runner = Tables<"runners">;
type HorseResult = Tables<"horse_results">;
type HorseDistanceAnalysis = Tables<"horse_distance_analysis"> & {
  horse_distance_details: (Tables<"horse_distance_details"> & {
    horse_distance_times: Tables<"horse_distance_times">[];
  })[];
};

interface DetailedHorseFormProps {
  runner: Runner;
  historicalResults: HorseResult[];
  distanceAnalysis?: HorseDistanceAnalysis;
  raceDistance?: string;
}

export const DetailedHorseForm = ({ 
  runner, 
  historicalResults,
  distanceAnalysis,
  raceDistance
}: DetailedHorseFormProps) => {
  // Calculate days since last race
  const calculateDaysSince = (raceDate: string) => {
    const days = Math.floor(
      (new Date().getTime() - new Date(raceDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${days}d`;
  };

  // Sort results by date descending
  const sortedResults = [...historicalResults].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className={`p-4 mb-4 ${runner.is_non_runner ? 'opacity-50' : ''}`}>
      <RunnerHeader 
        runner={runner}
        number={runner.number}
        silkUrl={runner.silk_url}
      />
      
      <RunnerDetails runner={runner} />
      
      {/* Performance Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
        <div>
          <p className="font-medium">Prizemoney</p>
          <p>£--</p>
        </div>
        <div>
          <p className="font-medium">Win Range</p>
          <p>--</p>
        </div>
        <div>
          <p className="font-medium">Win %</p>
          <p>--</p>
        </div>
        <div>
          <p className="font-medium">Place %</p>
          <p>--</p>
        </div>
      </div>
      
      {/* Distance Analysis Section - Only show for active runners */}
      {!runner.is_non_runner && distanceAnalysis && (
        <div className="mb-6">
          <HorseDistanceAnalysis 
            analysis={distanceAnalysis} 
            currentRaceDistance={raceDistance}
          />
        </div>
      )}

      {/* Only show odds table for active runners */}
      {!runner.is_non_runner && <OddsTable odds={runner.odds} />}

      {/* Race History */}
      <div className="space-y-2">
        <h4 className="font-medium mb-3">Recent Form</h4>
        {sortedResults.map((result, index) => (
          <div key={`${result.horse_id}-${result.race_id}-${index}`} 
               className="grid grid-cols-[80px_1fr] gap-4 text-sm border-t pt-2">
            <div className="text-muted-foreground">
              {calculateDaysSince(result.date)}
            </div>
            <div>
              <div className="flex justify-between">
                <span className="font-medium">{result.course}</span>
                <span className="text-muted-foreground">
                  {result.distance || '--'} {result.class ? `(${result.class})` : ''}
                </span>
              </div>
              <div className="text-muted-foreground">
                {result.going && `Going: ${result.going}`}
              </div>
              <div className="mt-1">
                <span className="font-medium">
                  {result.position || '--'} 
                </span>
                {result.winner && (
                  <span className="text-muted-foreground ml-2">
                    Winner: {result.winner}
                    {result.winner_btn && ` (${result.winner_btn})`}
                  </span>
                )}
              </div>
              {result.comment && (
                <p className="text-sm text-muted-foreground mt-1">{result.comment}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};