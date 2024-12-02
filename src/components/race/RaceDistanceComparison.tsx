import { useState } from "react";
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
import { Tables } from "@/integrations/supabase/types";
import { ChartControls } from "./chart/ChartControls";
import { ChartTooltipContent } from "./chart/ChartTooltipContent";
import { useChartData } from "./chart/useChartData";
import { SortOption } from "./chart/types";

interface RaceDistanceComparisonProps {
  analyses: (Tables<"horse_distance_analysis"> & {
    horse_distance_details: (Tables<"horse_distance_details"> & {
      horse_distance_times: Tables<"horse_distance_times">[];
    })[];
  })[];
  runners?: any[];
}

export const RaceDistanceComparison = ({ analyses, runners }: RaceDistanceComparisonProps) => {
  const [sortBy, setSortBy] = useState<SortOption>("number");
  
  // Filter out analyses for non-runners
  const activeAnalyses = analyses?.filter(analysis => {
    const runner = runners?.find(r => r.horse_id === analysis.horse_id);
    return runner && !runner.is_non_runner;
  });
  
  const chartData = useChartData(activeAnalyses, sortBy, runners?.filter(r => !r.is_non_runner));

  if (!activeAnalyses?.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No distance analysis data available for comparison
      </div>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Race Distance Comparison</h3>
      
      <ChartControls onSortChange={setSortBy} currentSort={sortBy} />
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
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
              tick={{ 
                fontSize: 11,
                fill: 'currentColor',
                dy: 10
              }}
            />
            <YAxis 
              yAxisId="left"
              domain={[0, 100]}
              label={{ 
                value: 'Rate (%)', 
                angle: -90, 
                position: 'insideLeft',
                style: { 
                  textAnchor: 'middle',
                  fontSize: 12,
                  fill: 'currentColor'
                }
              }}
              tick={{ fontSize: 11, fill: 'currentColor' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              domain={[0, 100]}
              label={{ 
                value: 'Rating', 
                angle: 90, 
                position: 'insideRight',
                style: { 
                  textAnchor: 'middle',
                  fontSize: 12,
                  fill: 'currentColor'
                }
              }}
              tick={{ fontSize: 11, fill: 'currentColor' }}
            />
            <Tooltip content={ChartTooltipContent} />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{
                fontSize: '12px'
              }}
            />
            <Bar 
              yAxisId="left" 
              dataKey="avgWinRate" 
              name="Win Rate" 
              fill="#8884d8" 
              radius={[4, 4, 0, 0]}
              animationDuration={500}
            />
            <Bar 
              yAxisId="left" 
              dataKey="avgPlaceRate" 
              name="Place Rate" 
              fill="#82ca9d" 
              radius={[4, 4, 0, 0]}
              animationDuration={500}
            />
            <Bar 
              yAxisId="right" 
              dataKey="speedRating" 
              name="Speed Rating" 
              fill="#ffc658" 
              radius={[4, 4, 0, 0]}
              animationDuration={500}
            />
            <Bar 
              yAxisId="right" 
              dataKey="overall" 
              name="Overall Score" 
              fill="#ff7300" 
              radius={[4, 4, 0, 0]}
              animationDuration={500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};