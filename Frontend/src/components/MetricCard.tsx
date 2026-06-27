import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  progress?: {
    value: number; // percentage
    color?: string; // e.g. bg-accent
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  icon,
  trend,
  progress,
}) => {
  return (
    <div className="bg-card hover:bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-slate-350 transition-all duration-300 shadow-sm relative overflow-hidden group">
      {/* Background soft glow indicator on hover */}
      <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-accent/5 rounded-full blur-xl group-hover:bg-accent/10 transition-colors duration-300"></div>

      <div className="flex justify-between items-start">
        <span className="text-slate-500 text-sm font-medium tracking-wide">{title}</span>
        {icon && (
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-accent group-hover:scale-105 transition-transform duration-200">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline space-x-2">
        <span className="text-3xl font-extrabold tracking-tight text-slate-800">{value}</span>
        {trend && (
          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend.type === 'positive' 
              ? 'bg-success/10 text-success' 
              : trend.type === 'negative' 
              ? 'bg-danger/10 text-danger' 
              : 'bg-slate-100 text-slate-500'
          }`}>
            {trend.type === 'positive' && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
            {trend.type === 'negative' && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {trend.value}
          </span>
        )}
      </div>

      {progress && (
        <div className="mt-4">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${progress.color || 'bg-accent'}`}
              style={{ width: `${progress.value}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Progress</span>
            <span>{progress.value}%</span>
          </div>
        </div>
      )}

      {subtext && !progress && (
        <p className="text-slate-500 text-xs mt-3 flex items-center">{subtext}</p>
      )}
    </div>
  );
};
