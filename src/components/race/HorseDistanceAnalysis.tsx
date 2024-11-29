import { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { HorseDistanceTable } from "./HorseDistanceTable";
import { HorseDistanceChart } from "./HorseDistanceChart";
import { sortDistances, convertTimeToSeconds, convertDistanceToFurlongs } from "./horseDistanceUtils";

interface HorseDistanceAnalysisProps {
  analysis: Tables<"horse_distance_analysis"> & {
    horse_distance_details: (Tables<"horse_distance_details"> & {
      horse_distance_times: Tables<"horse_distance_times">[];
    })[];
  };
  currentRaceDistance?: string;
}

export const HorseDistanceAnalysis = ({ analysis, currentRaceDistance }: HorseDistanceAnalysisProps) => {
  if (!analysis) {
    return <div className="text-sm text-muted-foreground">No distance analysis data available</div>;
  }

  // Sort the distance details
  const sortedDetails = [...analysis.horse_distance_details].sort(sortDistances);

  // Transform data for the graph
  const chartData = sortedDetails.map(detail => {
    // Calculate place rate (1st, 2nd, 3rd positions)
    const placeRate = ((detail.wins + detail.second_places + detail.third_places) / detail.runs) * 100;
    
    // Calculate seconds per furlong
    let secondsPerFurlong = 0;
    let validTimeCount = 0;

    detail.horse_distance_times?.forEach(time => {
      if (time.time && time.time !== '-') {
        const seconds = convertTimeToSeconds(time.time);
        const furlongs = convertDistanceToFurlongs(detail.dist);
        if (seconds > 0 && furlongs > 0) {
          secondsPerFurlong += seconds / furlongs;
          validTimeCount++;
        }
      }
    });

    const avgSecondsPerFurlong = validTimeCount > 0 ? 
      secondsPerFurlong / validTimeCount : 0;

    // Invert the time metric so faster times show as higher bars
    const maxPossibleTime = 20; // Assuming no horse takes more than 20 seconds per furlong
    const speedRating = avgSecondsPerFurlong > 0 ? 
      (maxPossibleTime - avgSecondsPerFurlong) * 5 : 0;

    return {
      distance: detail.dist,
      winRate: Number(detail.win_percentage || 0) * 100,
      placeRate: placeRate,
      speedRating: speedRating,
      actualPace: avgSecondsPerFurlong,
      runs: detail.runs,
      isCurrentDistance: detail.dist === currentRaceDistance
    };
  });

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Distance Analysis</h3>
      <HorseDistanceTable details={sortedDetails} currentRaceDistance={currentRaceDistance} />
      <div className="h-64">
        <HorseDistanceChart data={chartData} currentRaceDistance={currentRaceDistance} />
      </div>
    </Card>
  );
};