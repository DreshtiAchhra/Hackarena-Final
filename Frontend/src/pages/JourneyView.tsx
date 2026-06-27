import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { JourneyCard } from '../components/JourneyCard';
import { IssueCard } from '../components/IssueCard';
import { JourneyCompletionChart } from '../components/ChartCards';
import { mockJourney, mockIssues } from '../mock/auditData';
import { JourneyStep, UXIssue } from '../types';
import { GitMerge, ArrowRight, ArrowDown, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const JourneyView: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState<JourneyStep>(mockJourney[0]);

  // Find issues belonging to the selected page path
  const filteredIssues: UXIssue[] = mockIssues.filter(
    (issue) => issue.pageUrl === selectedStep.path
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 text-left">
        
        {/* Page Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white flex items-center">
            User Journey Visual Flow
            <span className="ml-3 inline-flex items-center text-[10px] tracking-wide font-extrabold uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
              Flowchart
            </span>
          </h2>
          <p className="text-slate-400 text-sm">Trace the checkout route to see where interface friction causes user drop-offs.</p>
        </div>

        {/* Visual Pipeline flow chart */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flow Architecture (Select a step to inspect)</span>
            <span className="text-xs text-slate-500 font-mono">Horizontal click-thru</span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-7 gap-4 items-center p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            {mockJourney.map((step, index) => {
              const isLast = index === mockJourney.length - 1;
              const isActive = selectedStep.id === step.id;

              return (
                <React.Fragment key={step.id}>
                  {/* Journey Node Card */}
                  <div className="xl:col-span-1 min-w-[190px]">
                    <JourneyCard 
                      step={step} 
                      isActive={isActive} 
                      onClick={() => setSelectedStep(step)} 
                    />
                  </div>

                  {/* Flow Arrow */}
                  {!isLast && (
                    <div className="flex justify-center xl:col-span-1 text-slate-600">
                      <ArrowRight className="w-5 h-5 hidden xl:block animate-pulse text-accent" />
                      <ArrowDown className="w-5 h-5 xl:hidden my-2 animate-pulse text-accent" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Funnel chart and Selected Step details side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Journey Dropoff Chart */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Dropoff Funnel</h3>
            <JourneyCompletionChart />
          </div>

          {/* Right panel: Selected Route Violations Inspector */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Violations on <span className="text-accent font-mono">{selectedStep.path}</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">{filteredIssues.length} issues found</span>
            </div>

            <div className="space-y-4 min-h-[320px] bg-slate-900/30 p-6 rounded-2xl border border-slate-800/50 flex flex-col justify-start">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedStep.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Page summary telemetry */}
                  <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <div>
                      <span className="text-xs text-slate-500">Page Identity</span>
                      <span className="text-base font-bold text-white block mt-0.5">{selectedStep.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Lighthouse rating</span>
                      <span className={`text-lg font-black block mt-0.5 ${
                        selectedStep.score >= 80 ? 'text-success' : selectedStep.score >= 70 ? 'text-warning' : 'text-danger'
                      }`}>{selectedStep.score}/100</span>
                    </div>
                  </div>

                  {/* List of issues for this page */}
                  {filteredIssues.length > 0 ? (
                    <div className="space-y-3.5">
                      {filteredIssues.map((issue) => (
                        <IssueCard key={issue.id} issue={issue} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-full mb-3">
                        <ShieldAlert className="w-8 h-8 text-success" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-350">Optimal compliance level achieved</h4>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">This route contains no critical issues or warnings in the current crawler index.</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};
export default JourneyView;
