import React from 'react';

interface LoaderProps {
  message?: string;
  submessage?: string;
}

export const Loader: React.FC<LoaderProps> = ({ 
  message = "Analyzing digital assets...", 
  submessage = "Applying UX heuristics and WCAG check engines" 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-2xl border border-slate-800 max-w-md mx-auto my-8">
      <div className="relative flex items-center justify-center w-20 h-20 mb-6">
        {/* Core Pulsing Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
        {/* Spinning Gradient Border */}
        <div className="absolute inset-0 rounded-full border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        {/* Inner Glowing Core */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-purple-600 animate-pulse shadow-accent-glow"></div>
      </div>
      <h3 className="text-lg font-semibold text-slate-100 text-center mb-2">{message}</h3>
      <p className="text-sm text-slate-400 text-center animate-pulse-slow">{submessage}</p>
    </div>
  );
};
