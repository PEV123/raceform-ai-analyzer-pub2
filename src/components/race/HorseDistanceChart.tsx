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
          tick={{ fill: 'currentColor' }}
        />
        <YAxis 
          yAxisId="left" 
          label={{ 
            value: 'Rate (%)', 
            angle: -90, 
            position: 'insideLeft',
            offset: 0,
            style: { textAnchor: 'middle' }
          }}
          tick={{ fill: 'currentColor' }}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          label={{ 
            value: 'Speed Rating', 
            angle: 90, 
            position: 'insideRight',
            offset: 0,
            style: { textAnchor: 'middle' }
          }}
          tick={{ fill: 'currentColor' }}
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
          cursor={{ stroke: '#666', strokeWidth: 1 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            
            return (
              <div className="bg-background border rounded-lg p-2 shadow-lg">
                <p className="font-medium">{payload[0].payload.distance}</p>
                {payload.map((entry: any, index: number) => (
                  <p key={index} className="text-sm">
                    {entry.name === 'speedRating' 
                      ? `Pace: ${entry.payload.actualPace}s per furlong`
                      : `${entry.name}: ${Number(entry.value).toFixed(1)}%`
                    }
                  </p>
                ))}
              </div>
            );
          }}
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