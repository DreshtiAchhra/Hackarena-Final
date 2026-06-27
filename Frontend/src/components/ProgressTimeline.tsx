import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

export interface TimelineStep {
  name: string;
  description: string;
  status: 'waiting' | 'running' | 'completed';
}

interface ProgressTimelineProps {
  steps: TimelineStep[];
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ steps }) => {
  return (
    <div className="relative pl-6 md:pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
      {steps.map((step, index) => {
        const isCompleted = step.status === 'completed';
        const isRunning = step.status === 'running';
        
        return (
          <motion.div 
            key={step.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex flex-col md:flex-row md:items-center justify-between"
          >
            {/* Status Bullet Icon */}
            <div className="absolute -left-[27px] md:-left-[29px] top-1 md:top-auto bg-background p-1 z-10">
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-success fill-success/15" />
              ) : isRunning ? (
                <div className="relative">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-accent/30 animate-ping"></span>
                  <Loader2 className="w-5 h-5 text-accent animate-spin" />
                </div>
              ) : (
                <Circle className="w-5 h-5 text-slate-600" />
              )}
            </div>

            <div className="space-y-1 pr-4 max-w-lg">
              <span className={`text-sm font-semibold tracking-wide transition-colors duration-200 ${
                isCompleted ? 'text-slate-200' : isRunning ? 'text-accent' : 'text-slate-500'
              }`}>
                {step.name}
              </span>
              <p className={`text-xs transition-colors duration-200 ${
                isCompleted ? 'text-slate-400' : isRunning ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {step.description}
              </p>
            </div>

            <div className="mt-2 md:mt-0 flex items-center">
              <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md border ${
                isCompleted 
                  ? 'bg-success/5 border-success/20 text-success' 
                  : isRunning 
                  ? 'bg-accent/5 border-accent/20 text-accent animate-pulse' 
                  : 'bg-slate-900/50 border-slate-800 text-slate-600'
              }`}>
                {step.status}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
