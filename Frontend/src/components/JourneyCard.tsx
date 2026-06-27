import React from 'react';
import { JourneyStep } from '../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, Link as LinkIcon, ArrowRight } from 'lucide-react';

interface JourneyCardProps {
  step: JourneyStep;
  isActive?: boolean;
  onClick?: () => void;
}

export const JourneyCard: React.FC<JourneyCardProps> = ({
  step,
  isActive = false,
  onClick,
}) => {
  const getStatusColor = (status: JourneyStep['status']) => {
    switch (status) {
      case 'passed':
        return {
          border: 'border-success/30 hover:border-success/60',
          bg: 'bg-success/5',
          text: 'text-success',
          icon: <ShieldCheck className="w-4 h-4 text-success" />,
          label: 'Healthy'
        };
      case 'warning':
        return {
          border: 'border-warning/30 hover:border-warning/60',
          bg: 'bg-warning/5',
          text: 'text-warning',
          icon: <AlertTriangle className="w-4 h-4 text-warning" />,
          label: 'Needs Review'
        };
      default:
        return {
          border: 'border-danger/30 hover:border-danger/60',
          bg: 'bg-danger/5',
          text: 'text-danger',
          icon: <AlertOctagon className="w-4 h-4 text-danger animate-pulse" />,
          label: 'Critical Violation'
        };
    }
  };

  const statusStyle = getStatusColor(step.status);

  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-2xl bg-card border transition-all duration-300 select-none cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
        isActive 
          ? 'ring-2 ring-accent border-transparent shadow-accent-glow' 
          : `border-slate-800 ${statusStyle.border}`
      }`}
    >
      {/* Background Soft Gradients */}
      <div className={`absolute -right-12 -bottom-12 w-28 h-28 rounded-full blur-2xl group-hover:opacity-100 opacity-60 transition-opacity duration-300 ${
        step.status === 'passed' ? 'bg-success/10' : step.status === 'warning' ? 'bg-warning/10' : 'bg-danger/10'
      }`}></div>

      {/* Header */}
      <div className="space-y-1.5 z-10">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-400 flex items-center">
            <LinkIcon className="w-3 h-3 mr-1 text-slate-500" />
            {step.path}
          </span>
          <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
        </div>
        <h4 className="text-lg font-bold text-white group-hover:text-accent transition-colors duration-200">{step.name}</h4>
      </div>

      {/* Issues Breakdown & Score Row */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-800/60 pt-4 z-10">
        <div className="flex space-x-3.5">
          <div className="text-center">
            <span className="text-xs text-slate-500 block">Critical</span>
            <span className="text-sm font-extrabold text-danger mt-0.5 block">{step.issuesCount.critical}</span>
          </div>
          <div className="text-center">
            <span className="text-xs text-slate-500 block">Warning</span>
            <span className="text-sm font-extrabold text-warning mt-0.5 block">{step.issuesCount.warning}</span>
          </div>
          <div className="text-center">
            <span className="text-xs text-slate-500 block">Info</span>
            <span className="text-sm font-semibold text-slate-400 mt-0.5 block">{step.issuesCount.info}</span>
          </div>
        </div>

        {/* Circular Metric Visual */}
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">UX Score</span>
            <span className={`text-xl font-black ${
              step.score >= 90 ? 'text-success' : step.score >= 70 ? 'text-warning' : 'text-danger'
            }`}>{step.score}</span>
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
            {step.score}%
          </div>
        </div>
      </div>

      {/* Chevron hover tag */}
      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-accent" />
      </div>
    </div>
  );
};
