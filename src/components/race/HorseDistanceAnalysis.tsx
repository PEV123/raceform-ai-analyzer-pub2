import { Tables } from "@/integrations/supabase/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface HorseDistanceAnalysisProps {
  analysis: Tables<"horse_distance_analysis"> & {
    horse_distance_details: (Tables<"horse_distance_details"> & {
      horse_distance_times: Tables<"horse_distance_times">[];
    })[];
  };
  currentRaceDistance?: string;
}

const convertTimeToSeconds = (timeStr: string): number => {
  if (!timeStr || timeStr === '-') return 0;
  const [mins, secs] = timeStr.split(':').map(Number);
  return mins * 60 + secs;
};

const convertDistanceToFurlongs = (dist: string): number => {
  const miles = dist.match(/(\d+)m/)?.[1] ? Number(dist.match(/(\d+)m/)[1]) : 0;
  const furlongs = dist.match(/(\d+)f/)?.[1] ? Number(dist.match(/(\d+)f/)[1]) : 0;
  const halfFurlong = dist.includes('½') ? 0.5 : 0;
  return (miles * 8) + furlongs + halfFurlong;
};

const formatSecondsPerFurlong = (seconds: number): string => {
  if (!seconds || seconds === 0) return '-';
  return seconds.toFixed(2);
};

// Sort distances from shortest to longest
const sortDistances = (a: Tables<"horse_distance_details">, b: Tables<"horse_distance_details">) => {
  const aFurlongs = convertDistanceToFurlongs(a.dist);
  const bFurlongs = convertDistanceToFurlongs(b.dist);
  return aFurlongs - bFurlongs;
};

export const HorseDistanceAnalysis = ({ analysis, currentRaceDistance }: HorseDistanceAnalysisProps) => {
  if (!analysis) {
    return <div className="text-sm text-muted-foreground">No distance analysis data available</div>;
  }

  // Sort the distance details
  const sortedDetails = [...analysis.horse_distance_details].sort(sortDistances);

  // Transform data for the graph and table
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
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Distance</TableHead>
            <TableHead>Runs</TableHead>
            <TableHead>Win Rate</TableHead>
            <TableHead>Place Rate</TableHead>
            <TableHead>Pace (s/f)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDetails.map((detail) => {
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

            const placeRate = ((detail.wins + detail.second_places + detail.third_places) / detail.runs) * 100;

            const isCurrentDistance = detail.dist === currentRaceDistance;

            return (
              <TableRow 
                key={detail.id}
                className={isCurrentDistance ? "bg-muted/50" : ""}
              >
                <TableCell>
                  {detail.dist}
                  {isCurrentDistance && (
                    <span className="ml-2 text-xs text-muted-foreground">(Today)</span>
                  )}
                </TableCell>
                <TableCell>{detail.runs}</TableCell>
                <TableCell>{detail.win_percentage ? `${(Number(detail.win_percentage) * 100).toFixed(1)}%` : '0%'}</TableCell>
                <TableCell>{`${placeRate.toFixed(1)}%`}</TableCell>
                <TableCell>{formatSecondsPerFurlong(avgSecondsPerFurlong)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="distance" />
            <YAxis yAxisId="left" label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Speed Rating', angle: 90, position: 'insideRight' }} />
            {currentRaceDistance && (
              <ReferenceLine
                x={currentRaceDistance}
                stroke="#888"
                strokeDasharray="3 3"
                label={{ value: "Today's Race", position: 'top' }}
              />
            )}
            <Tooltip 
              formatter={(value: any, name: string, props: any) => {
                if (name === 'Speed Rating') {
                  return [`${props.payload.actualPace.toFixed(2)}s per furlong`, 'Pace'];
                }
                return [`${Number(value).toFixed(1)}%`, name];
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="winRate"
              name="Win Rate %"
              stroke="#8884d8"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="placeRate"
              name="Place Rate %"
              stroke="#82ca9d"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="speedRating"
              name="Speed Rating"
              stroke="#ffc658"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};