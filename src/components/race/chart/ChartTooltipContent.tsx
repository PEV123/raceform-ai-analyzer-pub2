import { ChartData } from "./types";

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const ChartTooltipContent = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  
  const data = payload[0].payload as ChartData;
  
  return (
    <div className="bg-background border rounded-lg p-2 shadow-lg">
      <p className="font-medium mb-1">{data.fullName}</p>
      <p className="text-sm">Win Rate: {data.avgWinRate.toFixed(1)}%</p>
      <p className="text-sm">Place Rate: {data.avgPlaceRate.toFixed(1)}%</p>
      <p className="text-sm">Speed Rating: {data.speedRating.toFixed(1)}</p>
      <p className="text-sm">Overall Score: {data.overall.toFixed(1)}</p>
      <p className="text-sm">Pace: {data.actualPace}s per furlong</p>
      <p className="text-sm">Total Runs: {data.totalRuns}</p>
    </div>
  );
};