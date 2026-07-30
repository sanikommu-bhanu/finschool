import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

export function DonutChart({ data, size = 140, centerLabel }: { data: DonutDatum[]; size?: number; centerLabel?: React.ReactNode }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="65%" outerRadius="100%" paddingAngle={3} stroke="none">
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="absolute inset-0 flex items-center justify-center flex-col">{centerLabel}</div>
      )}
    </div>
  );
}
