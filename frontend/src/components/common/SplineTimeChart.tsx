import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DataPoint {
  time: string;
  events?: number;
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
  total_alerts?: number;
}

interface SplineTimeChartProps {
  data: DataPoint[];
  height?: number;
  showComparison?: boolean;
}

export const SplineTimeChart: React.FC<SplineTimeChartProps> = ({
  data,
  height = 260,
  showComparison = true,
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {/* Primary Cyan Glow Gradient */}
            <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.35} />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity={0} />
            </linearGradient>

            {/* Secondary Silver Gradient */}
            <linearGradient id="silverGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />

          <XAxis
            dataKey="time"
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
                  <div className="glass-panel p-3 rounded-xl border border-white/10 shadow-xl text-xs space-y-1">
                    <p className="font-semibold text-slate-200 border-b border-white/10 pb-1 mb-1">
                      Time: {label}
                    </p>
                    {payload.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          {entry.name}:
                        </span>
                        <span className="font-mono-code font-bold text-white">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />

          {/* Secondary Silver Curve (Total Events) */}
          {showComparison && (
            <Area
              type="monotone"
              dataKey="events"
              name="Telemetry Events"
              stroke="#e2e8f0"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#silverGradient)"
            />
          )}

          {/* Primary Cyan Glow Curve (Threat Alerts) */}
          <Area
            type="monotone"
            dataKey="total_alerts"
            name="Security Threats"
            stroke="#00f0ff"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#cyanGradient)"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.5))',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
