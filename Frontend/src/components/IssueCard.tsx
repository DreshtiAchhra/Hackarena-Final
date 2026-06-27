import React, { useState } from 'react';
import { UXIssue } from '../types';
import { AlertCircle, HelpCircle, FileText, CheckCircle2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface IssueCardProps {
  issue: UXIssue;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-danger/10 border-danger/20 text-danger',
          icon: <AlertCircle className="w-4 h-4 text-danger mr-1.5" />,
          label: 'Critical'
        };
      case 'warning':
        return {
          bg: 'bg-warning/10 border-warning/20 text-warning',
          icon: <AlertCircle className="w-4 h-4 text-warning mr-1.5" />,
          label: 'Warning'
        };
      default:
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-600',
          icon: <HelpCircle className="w-4 h-4 text-slate-500 mr-1.5" />,
          label: 'Info'
        };
    }
  };

  const getCategoryStyle = (category: string) => {
    return {
      bg: 'bg-slate-50 border border-slate-200 text-slate-700',
      label: category.charAt(0).toUpperCase() + category.slice(1)
    };
  };

  const severity = getSeverityStyle(issue.severity);
  const category = getCategoryStyle(issue.category);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-350 transition-all duration-200 shadow-sm">
      {/* Summary Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 flex items-start justify-between cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${severity.bg}`}>
              {severity.icon}
              {severity.label}
            </span>
            <span className={`inline-flex items-center text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${category.bg}`}>
              {category.label}
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
              {issue.pageUrl}
            </span>
          </div>

          <h4 className="text-base font-bold text-slate-800">{issue.title}</h4>
          <p className="text-sm text-slate-500 line-clamp-2">{issue.description}</p>
        </div>

        <div className="ml-4 flex items-center text-slate-400 hover:text-slate-650">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded Details */}
      {isOpen && (
        <div className="px-5 pb-5 border-t border-slate-200 bg-slate-50/30 space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Left/Middle detail text */}
            <div className="md:col-span-2 space-y-4">
              {/* Evidence */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600 flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1" />
                    Identified Code Evidence
                  </span>
                  <button 
                    onClick={() => handleCopy(issue.evidence)}
                    className="text-[10px] text-slate-500 hover:text-slate-750 flex items-center space-x-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-x-auto text-[11px] font-mono text-indigo-750 code-preview">
                  {issue.evidence}
                </div>
              </div>

              {/* Recommendation */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-650 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-success" />
                  Recommended Fix
                </span>
                <p className="text-sm text-emerald-800 bg-success/5 border border-success/20 p-3 rounded-lg">
                  {issue.recommendation}
                </p>
              </div>
            </div>

            {/* Right mock screenshot thumbnail */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-600">Screenshot Thumbnail</span>
              <div 
                className="w-full h-36 rounded-lg border border-slate-200 flex items-center justify-center relative overflow-hidden group shadow-inner"
                style={{ background: issue.screenshotPlaceholder }}
              >
                {/* Visual interface layout block mock */}
                <div className="absolute inset-2 bg-white/95 rounded-md border border-slate-200 flex flex-col p-2 space-y-2 select-none">
                  <div className="h-3 bg-slate-50 rounded w-1/2 flex items-center px-1"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-1"></div><span className="text-[6px] text-red-650">VIOLATION AREA</span></div>
                  <div className="h-6 bg-slate-50 rounded border border-dashed border-red-400 flex items-center justify-center"><span className="text-[8px] font-mono text-slate-600">ELEMENT INSPECTOR</span></div>
                  <div className="h-3 bg-slate-50 rounded w-3/4"></div>
                </div>
                <div className="absolute bottom-2 right-2 text-[9px] font-bold bg-white/90 text-slate-650 px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                  Inspect Frame
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
