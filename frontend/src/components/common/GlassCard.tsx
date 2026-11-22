import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = false,
  hover = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl transition-all duration-300
        ${glow ? 'glass-panel-glow' : 'glass-panel'}
        ${hover ? 'hover:border-cyan-500/30 hover:shadow-glass-glow cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Subtle top edge specular highlight */}
      <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
