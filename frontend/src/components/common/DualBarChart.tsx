import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DualBarItem {
  label: string;
  val1: number;
  val2: number;
}

interface DualBarChartProps {
  data: DualBarItem[];
  height?: number;
  label1?: string;
  label2?: string;
  color1?: string;
  color2?: string;
}

export const DualBarChart: React.FC<DualBarChartProps> = ({
  data,
  height = 200,
  label1 = 'Normal Traffic',
  label2 = 'Threat Mitigations',
  color1 = '#10b981', // Emerald green from Image 1
  color2 = '#e2e8f0', // Silver / white
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#64748b"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            tickLine={false}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass-panel p-2.5 rounded-xl border border-white/10 shadow-xl text-xs space-y-1">
                    <p className="font-semibold text-slate-200 border-b border-white/10 pb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          {entry.name}:
                        </span>
                        <span className="font-mono-code font-bold text-white">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="val1" name={label1} fill={color1} radius={[4, 4, 0, 0]} maxBarSize={14} />
          <Bar dataKey="val2" name={label2} fill={color2} radius={[4, 4, 0, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
