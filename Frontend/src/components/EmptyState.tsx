import React from 'react';
import { HelpCircle } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No audit results found",
  description = "Enter a website URL on the home page to launch the discovery engine and trace user journeys.",
  icon = <HelpCircle className="w-12 h-12 text-slate-500" />,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-slate-800 rounded-2xl max-w-lg mx-auto my-8">
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-full mb-4 animate-float">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-200 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-6 max-w-sm">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-accent hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-md shadow-accent-glow"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
