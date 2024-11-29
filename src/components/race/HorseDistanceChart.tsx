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
      <LineChart 
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="distance" 
          padding={{ left: 20, right: 20 }}
          scale="band"
          tickMargin={5}
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
        {currentRaceDistance && (
          <ReferenceLine
            x={currentRaceDistance}
            stroke="#888"
            strokeDasharray="3 3"
            yAxisId="left"
            label={{
              value: "Today's Race",
              position: 'top',
              fill: '#888',
              fontSize: 12,
            }}
            isFront={true}
          />
        )}
        <Tooltip 
          cursor={{ 
            stroke: '#666', 
            strokeWidth: 1, 
            strokeDasharray: '3 3',
            radius: 2
          }}
          formatter={(value: any, name: string, props: any) => {
            if (name === 'Speed Rating') {
              return [`${props.payload.actualPace}s per furlong`, 'Pace'];
            }
            return [`${Number(value).toFixed(1)}%`, name];
          }}
          wrapperStyle={{ zIndex: 100 }}
          offset={10}
        />
        <Legend verticalAlign="top" height={36} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="winRate"
          name="Win Rate %"
          stroke="#8884d8"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="placeRate"
          name="Place Rate %"
          stroke="#82ca9d"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="speedRating"
          name="Speed Rating"
          stroke="#ffc658"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};