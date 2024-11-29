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

export const RaceDistanceComparison = ({ analyses }: RaceDistanceComparisonProps) => {
  if (!analyses?.length) {
    return <div className="text-sm text-muted-foreground">No distance analysis data available for comparison</div>;
  }

  // Calculate average performance metrics for each horse
  const comparisonData = analyses.map(analysis => {
    const details = analysis.horse_distance_details || [];
    const avgWinRate = details.reduce((acc, detail) => 
      acc + (Number(detail.win_percentage) || 0), 0) / (details.length || 1);
    
    const avgTime = details.reduce((acc, detail) => {
      const detailAvgTime = detail.horse_distance_times?.reduce((timeAcc, time) => {
        if (time.time && time.time !== '-') {
          const [mins, secs] = time.time.split(':').map(Number);
          return timeAcc + (mins * 60 + secs);
        }
        return timeAcc;
      }, 0) / (detail.horse_distance_times?.filter(t => t.time && t.time !== '-').length || 1);
      return acc + (detailAvgTime || 0);
    }, 0) / (details.length || 1);

    return {
      horse: analysis.horse,
      avgWinRate: avgWinRate * 100, // Convert to percentage
      avgTime,
      totalRuns: analysis.total_runs
    };
  });

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Race Distance Comparison</h3>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="horse" angle={-45} textAnchor="end" height={100} />
            <YAxis yAxisId="left" label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Avg Time (s)', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="avgWinRate" name="Win Rate %" fill="#8884d8" />
            <Bar yAxisId="right" dataKey="avgTime" name="Avg Time (s)" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};