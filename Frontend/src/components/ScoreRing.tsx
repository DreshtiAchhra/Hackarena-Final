import React, { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;
  label: string;
  size?: number;
  strokeWidth?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  label,
  size = 120,
  strokeWidth = 10,
}) => {
  const [offset, setOffset] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    // Animate the fill on component mount
    const progressOffset = circumference - (score / 100) * circumference;
    const timeout = setTimeout(() => {
      setOffset(progressOffset);
    }, 100);
    return () => clearTimeout(timeout);
  }, [score, circumference]);

  // Color selection based on standard lighthouse metrics
  const getColor = (val: number) => {
    if (val >= 90) return {
      stroke: 'stroke-success',
      text: 'text-success',
      glow: 'rgba(34, 197, 94, 0.15)',
      bg: 'bg-success/5'
    };
    if (val >= 50) return {
      stroke: 'stroke-warning',
      text: 'text-warning',
      glow: 'rgba(245, 158, 11, 0.15)',
      bg: 'bg-warning/5'
    };
    return {
      stroke: 'stroke-danger',
      text: 'text-danger',
      glow: 'rgba(239, 68, 68, 0.15)',
      bg: 'bg-danger/5'
    };
  };

  const colors = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80">
      <div 
        className="relative flex items-center justify-center rounded-full transition-all duration-300"
        style={{ width: size, height: size }}
      >
        {/* SVG Circle Drawing */}
        <svg className="w-full h-full transform -rotate-90">
          {/* Background Track */}
          <circle
            className="stroke-slate-800"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Active Path */}
          <circle
            className={`transition-all duration-1000 ease-out ${colors.stroke}`}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{
              filter: `drop-shadow(0 0 4px ${colors.glow})`
            }}
          />
        </svg>

        {/* Value Label inside Ring */}
        <div className="absolute text-center">
          <span className="text-3xl font-extrabold tracking-tight text-white">{score}</span>
          <span className="text-xs text-slate-500 block">/ 100</span>
        </div>
      </div>
      
      {/* Label Subtext */}
      <span className="text-sm font-semibold text-slate-300 mt-4 tracking-wide text-center">{label}</span>
      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1.5 ${colors.bg} ${colors.text}`}>
        {score >= 90 ? 'Optimal' : score >= 50 ? 'Needs Work' : 'Critical'}
      </span>
    </div>
  );
};
