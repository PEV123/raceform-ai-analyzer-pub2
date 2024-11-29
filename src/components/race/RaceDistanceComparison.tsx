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
    
    const avgWinRate = details.reduce((acc, detail) => 
      acc + (Number(detail.win_percentage) || 0), 0) / (details.length || 1);
    
    const avgPlaceRate = details.reduce((acc, detail) => {
      const placeRate = ((detail.wins + detail.second_places + detail.third_places) / detail.runs) * 100;
      return acc + (placeRate || 0);
    }, 0) / (details.length || 1);
    
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

    const maxPossibleTime = 20;
    const invertedTimeMetric = avgSecondsPerFurlong > 0 ? 
      (maxPossibleTime - avgSecondsPerFurlong) * 5 : 0;

    return {
      horse: analysis.horse,
      avgWinRate: avgWinRate * 100,
      avgPlaceRate: avgPlaceRate,
      speedRating: invertedTimeMetric,
      actualPace: avgSecondsPerFurlong.toFixed(2),
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
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
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
              tick={{ fontSize: 12, fill: 'currentColor' }}
            />
            <YAxis 
              yAxisId="left"
              domain={[0, 100]}
              label={{ 
                value: 'Rate (%)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
              tick={{ fontSize: 12, fill: 'currentColor' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              domain={[-50, 50]}
              label={{ 
                value: 'Speed Rating', 
                angle: 90, 
                position: 'insideRight',
                style: { textAnchor: 'middle' }
              }}
              tick={{ fontSize: 12, fill: 'currentColor' }}
            />
            <Tooltip 
              wrapperStyle={{ outline: 'none' }}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                
                return (
                  <div className="bg-background border rounded-lg p-2 shadow-lg">
                    <p className="font-medium mb-1">{payload[0].payload.horse}</p>
                    {payload.map((entry: any) => (
                      <p key={entry.name} className="text-sm">
                        {entry.name === 'speedRating' 
                          ? `Avg Pace: ${entry.payload.actualPace}s per furlong`
                          : `${entry.name}: ${Number(entry.value).toFixed(1)}%`
                        }
                      </p>
                    ))}
                  </div>
                );
              }}
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