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
  ResponsiveContainer
} from 'recharts';

interface HorseDistanceAnalysisProps {
  analysis: Tables<"horse_distance_analysis"> & {
    horse_distance_details: (Tables<"horse_distance_details"> & {
      horse_distance_times: Tables<"horse_distance_times">[];
    })[];
  };
}

export const HorseDistanceAnalysis = ({ analysis }: HorseDistanceAnalysisProps) => {
  if (!analysis) {
    return <div className="text-sm text-muted-foreground">No distance analysis data available</div>;
  }

  // Transform data for the graph and table
  const chartData = analysis.horse_distance_details?.map(detail => {
    // Calculate place rate (1st, 2nd, 3rd positions)
    const placeRate = ((detail.wins + detail.second_places + detail.third_places) / detail.runs) * 100;
    
    const avgTime = detail.horse_distance_times?.reduce((acc, time) => {
      if (time.time && time.time !== '-') {
        const [mins, secs] = time.time.split(':').map(Number);
        return acc + (mins * 60 + secs);
      }
      return acc;
    }, 0) / (detail.horse_distance_times?.filter(t => t.time && t.time !== '-').length || 1);

    return {
      distance: detail.dist,
      winRate: Number(detail.win_percentage || 0) * 100,
      placeRate: placeRate,
      averageTime: avgTime,
      runs: detail.runs
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
            <TableHead>Avg Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analysis.horse_distance_details?.map((detail) => {
            const avgTime = detail.horse_distance_times?.reduce((acc, time) => {
              if (time.time && time.time !== '-') {
                const [mins, secs] = time.time.split(':').map(Number);
                return acc + (mins * 60 + secs);
              }
              return acc;
            }, 0) / (detail.horse_distance_times?.filter(t => t.time && t.time !== '-').length || 1);

            const placeRate = ((detail.wins + detail.second_places + detail.third_places) / detail.runs) * 100;

            return (
              <TableRow key={detail.id}>
                <TableCell>{detail.dist}</TableCell>
                <TableCell>{detail.runs}</TableCell>
                <TableCell>{detail.win_percentage ? `${(Number(detail.win_percentage) * 100).toFixed(1)}%` : '0%'}</TableCell>
                <TableCell>{`${placeRate.toFixed(1)}%`}</TableCell>
                <TableCell>
                  {avgTime ? `${Math.floor(avgTime / 60)}:${(avgTime % 60).toFixed(2).padStart(5, '0')}` : '-'}
                </TableCell>
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
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Avg Time (s)', angle: 90, position: 'insideRight' }} />
            <Tooltip />
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
              dataKey="averageTime"
              name="Avg Time (s)"
              stroke="#ffc658"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};