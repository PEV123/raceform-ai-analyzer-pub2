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
          {entry.name.includes('Rate') 
            ? `${entry.name}: ${Number(entry.value).toFixed(1)}%`
            : entry.name === 'Speed Rating'
            ? `${entry.name}: ${Number(entry.value).toFixed(1)}`
            : entry.name === 'Overall Score'
            ? `${entry.name}: ${Number(entry.value).toFixed(1)}`
            : `Avg Pace: ${entry.payload.actualPace}s per furlong`
          }
        </p>
      ))}
      <p className="text-sm mt-1">
        Total Runs: {payload[0].payload.totalRuns}
      </p>
    </Card>
  );
};