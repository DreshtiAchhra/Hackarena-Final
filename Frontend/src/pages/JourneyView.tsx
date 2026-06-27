import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { JourneyCard } from '../components/JourneyCard';
import { IssueCard } from '../components/IssueCard';
import { JourneyCompletionChart } from '../components/ChartCards';
import { mockJourney, mockIssues } from '../mock/auditData';
import { JourneyStep, UXIssue } from '../types';
import { DiscoveryResult } from '../types/backend';
import { ArrowRight, ArrowDown, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const JourneyView: React.FC = () => {
  const [discoveryData, setDiscoveryData] = useState<DiscoveryResult | null>(null);
  const [selectedStep, setSelectedStep] = useState<JourneyStep | null>(null);

  // Load results from storage
  useEffect(() => {
    const rawDisc = localStorage.getItem('discovery_result');
    if (rawDisc) {
      const parsed: DiscoveryResult = JSON.parse(rawDisc);
      setDiscoveryData(parsed);
    }
  }, []);

  // Map backend discovered pages dynamically to visual journey nodes
  const journeySteps: JourneyStep[] = discoveryData 
    ? discoveryData.pages.slice(0, 4).map((page, index) => {
        const pathName = page.url.replace(discoveryData.seed_url, '') || '/';
        const cleanName = pathName === '/' 
          ? 'Home Page' 
          : pathName.replace(/^\//, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        const mockStep = mockJourney[index] || mockJourney[mockJourney.length - 1];
        
        return {
          id: `j-${index}`,
          name: cleanName,
          path: pathName,
          score: index === 0 ? 89 : index === 1 ? 81 : index === 2 ? 72 : 61,
          issuesCount: mockStep.issuesCount,
          status: index === 0 ? 'passed' : index === 1 ? 'warning' : 'failed',
          connections: index < Math.min(discoveryData.pages.length, 4) - 1 ? [`j-${index + 1}`] : []
        };
      })
    : [];

  // Handle selected step initialization
  useEffect(() => {
    if (journeySteps.length > 0 && !selectedStep) {
      setSelectedStep(journeySteps[0]);
    }
  }, [journeySteps]);

  // Find issues belonging to the selected page path
  const filteredIssues: UXIssue[] = selectedStep
    ? mockIssues.filter((issue) => issue.pageUrl === selectedStep.path || (selectedStep.path === '/' && issue.pageUrl === '/'))
    : [];

  if (journeySteps.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 bg-card border border-slate-200 rounded-2xl max-w-lg mx-auto my-8">
          <ShieldAlert className="w-12 h-12 text-slate-400 mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No journey map compiled</h3>
          <p className="text-slate-500 text-sm mb-6">Enter a domain URL on the landing home page to scan and discover sitemap paths.</p>
        </div>
      </DashboardLayout>
    );
  }

  const activeStep = selectedStep || journeySteps[0];

  return (
    <DashboardLayout>
      <div className="space-y-8 text-left">
        
        {/* Page Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-800 flex items-center">
            User Journey Visual Flow
            <span className="ml-3 inline-flex items-center text-[10px] tracking-wide font-extrabold uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
              Flowchart
            </span>
          </h2>
          <p className="text-slate-550 text-sm">Trace the checkout route to see where interface friction causes user drop-offs.</p>
        </div>

        {/* Visual Pipeline flow chart */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flow Architecture (Select a step to inspect)</span>
            <span className="text-xs text-slate-455 font-mono">Horizontal click-thru</span>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-6 bg-slate-55 border border-slate-200 rounded-2xl overflow-x-auto w-full">
            {journeySteps.map((step, index) => {
              const isLast = index === journeySteps.length - 1;
              const isActive = activeStep.id === step.id;

              return (
                <React.Fragment key={step.id}>
                  {/* Journey Node Card */}
                  <div className="w-full lg:w-fit shrink-0">
                    <JourneyCard 
                      step={step} 
                      isActive={isActive} 
                      onClick={() => setSelectedStep(step)} 
                    />
                  </div>

                  {/* Flow Arrow */}
                  {!isLast && (
                    <div className="flex justify-center text-slate-400 shrink-0">
                      <ArrowRight className="w-5 h-5 hidden lg:block animate-pulse text-accent" />
                      <ArrowDown className="w-5 h-5 lg:hidden my-2 animate-pulse text-accent" />
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
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Dropoff Funnel</h3>
            <JourneyCompletionChart />
          </div>

          {/* Right panel: Selected Route Violations Inspector */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Violations on <span className="text-accent font-bold">{activeStep.path.replace(/\//g, '') || 'Home'}</span>
              </h3>
              <span className="text-xs text-slate-600 font-mono font-semibold">{filteredIssues.length} issues found</span>
            </div>

            <div className="space-y-4 min-h-[320px] bg-slate-50/50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-start">
              <div className="space-y-4">
                {/* Page summary telemetry */}
                <div className="flex items-center justify-between p-4 bg-white border border-slate-250 rounded-xl shadow-sm">
                  <div>
                    <span className="text-xs text-slate-550 block">Page Identity</span>
                    <span className="text-base font-bold text-slate-800 mt-0.5 block">{activeStep.name}</span>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block uppercase font-extrabold tracking-wider">UX Score</span>
                      <span className={`text-base font-extrabold block mt-0.5 ${
                        activeStep.score >= 80 ? 'text-success' : activeStep.score >= 70 ? 'text-warning' : 'text-danger'
                      }`}>{activeStep.score}/100</span>
                    </div>
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-black shadow-sm shrink-0 ${
                      activeStep.score >= 80 
                        ? 'border-success/30 bg-success/5 text-success' 
                        : activeStep.score >= 70 
                        ? 'border-warning/30 bg-warning/5 text-warning' 
                        : 'border-danger/30 bg-danger/5 text-danger'
                    }`}>
                      {activeStep.score}%
                    </div>
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
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-full mb-3">
                      <ShieldAlert className="w-8 h-8 text-success" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">Optimal compliance level achieved</h4>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">This route contains no critical issues or warnings in the current crawler index.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};
export default JourneyView;
