import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function Sparkline({ data, color = 'hsl(217, 91%, 60%)' }) {
  // data: [{ value: number }, ...]
  // If no data or single point, show flat line
  const chartData = (!data || data.length === 0)
    ? [{ value: 0 }, { value: 0 }]
    : data;

  return (
    <ResponsiveContainer width={48} height={24}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
