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

interface HorseDistanceChartProps {
  data: any[];
  currentRaceDistance?: string;
}

export const HorseDistanceChart = ({ data, currentRaceDistance }: HorseDistanceChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="distance" />
        <YAxis 
          yAxisId="left" 
          label={{ 
            value: 'Rate (%)', 
            angle: -90, 
            position: 'insideLeft' 
          }} 
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          label={{ 
            value: 'Speed Rating', 
            angle: 90, 
            position: 'insideRight' 
          }} 
        />
        {currentRaceDistance && (
          <ReferenceLine
            x={currentRaceDistance}
            stroke="#888"
            strokeDasharray="3 3"
            label={{ value: "Today's Race", position: 'top' }}
            yAxisId="left"
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
  );
};