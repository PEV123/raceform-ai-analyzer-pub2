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
          tick={{ fontSize: 12, fill: 'currentColor' }}
          height={60}
          interval={0}
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
        {currentRaceDistance && (
          <ReferenceLine
            x={currentRaceDistance}
            yAxisId="left"
            stroke="#888"
            strokeDasharray="3 3"
            label={{
              value: "Today's Race",
              position: 'top',
              fill: '#888',
              fontSize: 12
            }}
          />
        )}
        <Tooltip 
          wrapperStyle={{ outline: 'none' }}
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #ccc',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          cursor={{ strokeDasharray: '3 3' }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            
            return (
              <div className="bg-background border rounded-lg p-2 shadow-lg">
                <p className="font-medium mb-1">{label}</p>
                {payload.map((entry: any) => (
                  <p key={entry.name} className="text-sm">
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