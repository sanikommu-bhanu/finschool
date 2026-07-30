import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

interface TrendChartProps {
  data: { [key: string]: string | number }[];
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
}

export function TrendChart({ data, xKey, yKey, height = 120, color = '#EE7A90' }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey={xKey} hide />
        <Tooltip
          contentStyle={{
            background: 'rgba(255,255,255,0.85)',
            border: 'none',
            borderRadius: 12,
            fontSize: 12,
            boxShadow: '0 8px 24px rgba(200,120,140,0.25)',
          }}
        />
        <Area type="monotone" dataKey={yKey} stroke={color} strokeWidth={2.5} fill="url(#trendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
