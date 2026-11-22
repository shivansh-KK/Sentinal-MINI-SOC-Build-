import React from 'react';

interface HeatmapProps {
  title?: string;
}

export const ThreatHeatmap: React.FC<HeatmapProps> = ({ title = 'Attack Activity Heatmap' }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const intervals = Array.from({ length: 10 }, (_, i) => i + 1);

  // Generate realistic deterministic heat levels (0 to 4)
  const getLevel = (row: number, col: number) => {
    const seed = (row * 7 + col * 13) % 19;
    if (seed > 15) return 4; // High intensity cyan
    if (seed > 10) return 3; // Electric blue
    if (seed > 6) return 2;  // Medium navy blue
    if (seed > 2) return 1;  // Low deep blue
    return 0;                // Idle obsidian
  };

  const colorStyles = [
    'bg-[#0d1527] border-white/5',
    'bg-[#1e3a8a]/50 border-blue-500/20',
    'bg-[#2563eb]/70 border-blue-400/30',
    'bg-[#0284c7] border-cyan-400/40 shadow-[0_0_8px_rgba(2,132,199,0.3)]',
    'bg-[#00f0ff] border-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.6)] animate-pulse',
  ];

  return (
    <div className="flex flex-col h-full justify-between">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</span>
          <span className="text-[10px] text-cyan-400 font-mono-code">24h Telemetry</span>
        </div>
      )}

      <div className="space-y-1.5 flex-1 flex flex-col justify-center">
        {days.map((day, rIdx) => (
          <div key={day} className="flex items-center gap-1.5">
            <span className="w-7 text-[10px] font-mono-code text-slate-400">{day}</span>
            <div className="grid grid-cols-10 gap-1.5 flex-1">
              {intervals.map((col, cIdx) => {
                const level = getLevel(rIdx, cIdx);
                return (
                  <div
                    key={col}
                    title={`${day} Block ${col}: Intensity Level ${level}`}
                    className={`h-4.5 rounded-sm border transition-all duration-300 hover:scale-110 cursor-pointer ${colorStyles[level]}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-white/5 font-mono-code">
        <span>Low Intensity</span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#0d1527] border border-white/5" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#1e3a8a]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#2563eb]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#0284c7]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#00f0ff]" />
        </div>
        <span>Critical Surge</span>
      </div>
    </div>
  );
};
