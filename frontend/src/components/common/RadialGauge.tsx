import React from 'react';

interface RadialGaugeProps {
  value: number; // 0 to 100
  title: string;
  subtitle?: string;
  size?: number;
  strokeWidth?: number;
  color?: 'cyan' | 'emerald' | 'amber' | 'red' | 'silver';
  icon?: React.ReactNode;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  title,
  subtitle,
  size = 140,
  strokeWidth = 10,
  color = 'cyan',
  icon,
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  const colorMap = {
    cyan: {
      stroke: '#00f0ff',
      glow: 'rgba(0, 240, 255, 0.45)',
      gradient: ['#00f0ff', '#3b82f6'],
    },
    emerald: {
      stroke: '#10b981',
      glow: 'rgba(16, 185, 129, 0.45)',
      gradient: ['#10b981', '#059669'],
    },
    amber: {
      stroke: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.45)',
      gradient: ['#f59e0b', '#d97706'],
    },
    red: {
      stroke: '#ef4444',
      glow: 'rgba(239, 68, 68, 0.45)',
      gradient: ['#ef4444', '#b91c1c'],
    },
    silver: {
      stroke: '#e2e8f0',
      glow: 'rgba(226, 232, 240, 0.35)',
      gradient: ['#f8fafc', '#94a3b8'],
    },
  };

  const currentTheme = colorMap[color];
  const gradientId = `radial-grad-${color}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={currentTheme.gradient[0]} />
              <stop offset="100%" stopColor={currentTheme.gradient[1]} />
            </linearGradient>
            <filter id={`glow-${gradientId}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            filter={`url(#glow-${gradientId})`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            {value}
            <span className="text-sm font-normal text-slate-400 ml-0.5">%</span>
          </span>
          {subtitle && (
            <span className="text-[11px] font-medium text-slate-400 mt-0.5">
              {subtitle}
            </span>
          )}
          {icon && (
            <div className="mt-1 text-cyan-400 opacity-80">
              {icon}
            </div>
          )}
        </div>
      </div>
      <span className="mt-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
        {title}
      </span>
    </div>
  );
};
