import { Card } from "@/components/ui/card";

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const ChartTooltipContent = ({ active, payload, label }: ChartTooltipContentProps) => {
  if (!active || !payload?.length) return null;
  
  return (
    <Card className="bg-background border rounded-lg p-2 shadow-lg">
      <p className="font-medium mb-1">{payload[0].payload.fullName}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-sm">
          {entry.name === 'speedRating' 
            ? `Avg Pace: ${entry.payload.actualPace}s per furlong`
            : entry.name === 'overall'
            ? `Overall Score: ${Number(entry.value).toFixed(1)}`
            : `${entry.name}: ${Number(entry.value).toFixed(1)}%`
          }
        </p>
      ))}
      <p className="text-sm mt-1">
        Total Runs: {payload[0].payload.totalRuns}
      </p>
    </Card>
  );
};