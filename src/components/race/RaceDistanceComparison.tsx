import { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface RaceDistanceComparisonProps {
  analyses: (Tables<"horse_distance_analysis"> & {
    horse_distance_details: (Tables<"horse_distance_details"> & {
      horse_distance_times: Tables<"horse_distance_times">[];
    })[];
  })[];
}

const convertTimeToSeconds = (timeStr: string): number => {
  if (!timeStr || timeStr === '-') return 0;
  const [mins, secs] = timeStr.split(':').map(Number);
  return mins * 60 + secs;
};

const convertDistanceToFurlongs = (dist: string): number => {
  // Extract numbers and units from distance string (e.g., "2m4½f" -> 20.5f)
  const miles = dist.match(/(\d+)m/)?.[1] ? Number(dist.match(/(\d+)m/)[1]) : 0;
  const furlongs = dist.match(/(\d+)f/)?.[1] ? Number(dist.match(/(\d+)f/)[1]) : 0;
  const halfFurlong = dist.includes('½') ? 0.5 : 0;
  
  return (miles * 8) + furlongs + halfFurlong;
};

export const RaceDistanceComparison = ({ analyses }: RaceDistanceComparisonProps) => {
  if (!analyses?.length) {
    return <div className="text-sm text-muted-foreground">No distance analysis data available for comparison</div>;
  }

  // Calculate performance metrics for each horse
  const comparisonData = analyses.map(analysis => {
    const details = analysis.horse_distance_details || [];
    
    // Calculate average win rate
    const avgWinRate = details.reduce((acc, detail) => 
      acc + (Number(detail.win_percentage) || 0), 0) / (details.length || 1);
    
    // Calculate average place rate
    const avgPlaceRate = details.reduce((acc, detail) => {
      const placeRate = ((detail.wins + detail.second_places + detail.third_places) / detail.runs) * 100;
      return acc + (placeRate || 0);
    }, 0) / (details.length || 1);
    
    // Calculate average seconds per furlong
    let totalSecondsPerFurlong = 0;
    let validTimeCount = 0;

    details.forEach(detail => {
      detail.horse_distance_times?.forEach(time => {
        if (time.time && time.time !== '-') {
          const seconds = convertTimeToSeconds(time.time);
          const furlongs = convertDistanceToFurlongs(detail.dist);
          if (seconds > 0 && furlongs > 0) {
            totalSecondsPerFurlong += seconds / furlongs;
            validTimeCount++;
          }
        }
      });
    });

    const avgSecondsPerFurlong = validTimeCount > 0 ? 
      totalSecondsPerFurlong / validTimeCount : 0;

    // Invert the time metric so faster times show as higher bars
    const maxPossibleTime = 20; // Assuming no horse takes more than 20 seconds per furlong
    const invertedTimeMetric = avgSecondsPerFurlong > 0 ? 
      (maxPossibleTime - avgSecondsPerFurlong) * 5 : 0; // Multiply by 5 to make the differences more visible

    return {
      horse: analysis.horse,
      avgWinRate: avgWinRate * 100,
      avgPlaceRate: avgPlaceRate,
      speedRating: invertedTimeMetric, // Now higher is better
      actualPace: avgSecondsPerFurlong.toFixed(2), // Store actual pace for tooltip
      totalRuns: analysis.total_runs
    };
  });

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Race Distance Comparison</h3>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={comparisonData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            barGap={2}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="horse" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              interval={0}
              scale="band"
              tickMargin={5}
              padding={{ left: 20, right: 20 }}
            />
            <YAxis 
              yAxisId="left" 
              label={{ 
                value: 'Rate (%)', 
                angle: -90, 
                position: 'insideLeft',
                offset: 0
              }}
              padding={{ top: 20, bottom: 20 }}
              tickCount={5}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              label={{ 
                value: 'Speed Rating', 
                angle: 90, 
                position: 'insideRight',
                offset: 0
              }}
              padding={{ top: 20, bottom: 20 }}
              tickCount={5}
            />
            <Tooltip 
              cursor={{ 
                fill: 'rgba(0, 0, 0, 0.1)',
                radius: 2
              }}
              formatter={(value: any, name: string, props: any) => {
                if (name === 'Speed Rating') {
                  return [`${props.payload.actualPace}s per furlong`, 'Avg Pace'];
                }
                return [`${value.toFixed(1)}%`, name];
              }}
              wrapperStyle={{ zIndex: 100 }}
              offset={10}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar 
              yAxisId="left" 
              dataKey="avgWinRate" 
              name="Win Rate %" 
              fill="#8884d8" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="left" 
              dataKey="avgPlaceRate" 
              name="Place Rate %" 
              fill="#82ca9d" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="right" 
              dataKey="speedRating" 
              name="Speed Rating" 
              fill="#ffc658" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};