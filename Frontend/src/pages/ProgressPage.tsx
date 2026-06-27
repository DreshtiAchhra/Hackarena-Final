import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProgressTimeline, TimelineStep } from '../components/ProgressTimeline';
import { Terminal, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProgressPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetUrl = searchParams.get('url') || 'https://shoppycart.io';
  
  const [activeStep, setActiveStep] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Setup stages matching requirements
  const [steps, setSteps] = useState<TimelineStep[]>([
    { name: 'Website Discovery', description: 'Crawling site map and discovering dynamic paths', status: 'running' },
    { name: 'Page Prioritization', description: 'Mapping visual complexity and categorizing flows', status: 'waiting' },
    { name: 'Browser Agent', description: 'Dispatching headless chromium agent to trace checkout paths', status: 'waiting' },
    { name: 'Lighthouse Audits', description: 'Running performance, SEO, and baseline audits', status: 'waiting' },
    { name: 'Knowledge Builder', description: 'Constructing localized page accessibility context matrices', status: 'waiting' },
    { name: 'UX Analysis Heuristics', description: 'Evaluating elements against 10 Jakob Nielsen rules', status: 'waiting' },
    { name: 'Recommendation Engine', description: 'Generating React component patches and alt corrections', status: 'waiting' },
    { name: 'Report Generation', description: 'Compiling violations database and initializing dashboard', status: 'waiting' },
  ]);

  const logTemplates = [
    // Step 0: Discovery
    [`[DISCOVER] Connecting to target: ${targetUrl}`, `[DISCOVER] Crawling sitemap...`, `[DISCOVER] Identified 24 pages (Checkout, Products, Cart, Blog, About...)`, `[DISCOVER] Discovery complete.`],
    // Step 1: Prioritization
    [`[PRIORITIZE] Evaluating page weights...`, `[PRIORITIZE] Selected user flow: / -> /products -> /cart -> /checkout (highest conversion priority)`, `[PRIORITIZE] Pipeline configured.`],
    // Step 2: Browser Agent
    [`[AGENT] Launching Headless Chromium context...`, `[AGENT] Simulating user click on 'Products Browse' link`, `[AGENT] Simulating cart item addition...`, `[AGENT] Simulating Checkout form entry...`, `[AGENT] Warning: checkout action took 2.4s to respond.`],
    // Step 3: Lighthouse
    [`[LIGHTHOUSE] Injecting performance auditor tools...`, `[LIGHTHOUSE] Performance score: 84 | SEO score: 89`, `[LIGHTHOUSE] Cumulative Layout Shift (CLS) detected: 0.18 on /products.`],
    // Step 4: Knowledge Builder
    [`[KNOWLEDGE] Parsing visual accessibility tree...`, `[KNOWLEDGE] Built element schema for checkout form (Card number, Expiry, CVV)`, `[KNOWLEDGE] Found 6 accessibility violations in tree.`],
    // Step 5: Heuristic Analysis
    [`[HEURISTICS] Evaluating contrast ratio guidelines...`, `[HEURISTICS] Critical failure: /checkout button contrast is 3.2:1 (required: 4.5:1)`, `[HEURISTICS] Heuristics analysis complete.`],
    // Step 6: Recommendation Engine
    [`[PATCH] Creating element recommendation for contrast issue...`, `[PATCH] Formulated class rewrite: 'bg-[#4F46E5] text-[#FFFFFF]'`, `[PATCH] Created touch target sizing suggestions.`],
    // Step 7: Report Ready
    [`[REPORT] Saving report data to local cache...`, `[REPORT] Executive UX Audit compiled.`, `[SUCCESS] Audit completed for ${targetUrl}. Ready for dashboard review!`],
  ];

  // Timed progress simulator
  useEffect(() => {
    if (activeStep >= steps.length) return;

    // Load initial logs for this step
    const currentStepLogs = logTemplates[activeStep] || [];
    currentStepLogs.forEach((log, index) => {
      setTimeout(() => {
        setConsoleLogs(prev => [...prev, log]);
      }, index * 300);
    });

    // Advance step after specific time duration
    const stepDuration = currentStepLogs.length * 350 + 600;
    const timeout = setTimeout(() => {
      setSteps(prev => {
        const nextSteps = [...prev];
        // Complete current step
        nextSteps[activeStep].status = 'completed';
        
        // Start next step
        const nextStepIdx = activeStep + 1;
        if (nextStepIdx < nextSteps.length) {
          nextSteps[nextStepIdx].status = 'running';
        }
        return nextSteps;
      });
      setActiveStep(prev => prev + 1);
    }, stepDuration);

    return () => clearTimeout(timeout);
  }, [activeStep]);

  // Autoscroll terminal
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  const isFinished = activeStep >= steps.length;

  return (
    <MainLayout>
      <div className="py-8 max-w-5xl mx-auto space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white flex items-center">
              <Cpu className="w-6 h-6 text-accent mr-2 animate-spin" style={{ animationDuration: '6s' }} />
              Audit Execution Pipeline
            </h2>
            <p className="text-slate-400 text-xs font-mono">Target: {targetUrl}</p>
          </div>

          <AnimatePresence>
            {isFinished && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-success hover:bg-emerald-600 text-slate-950 text-sm font-bold rounded-lg transition-all duration-200 shadow-md shadow-success/20 self-start"
              >
                <span>View Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Stepper Pipeline */}
          <div className="lg:col-span-5 bg-card border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Pipeline Stages</h3>
            <ProgressTimeline steps={steps} />
          </div>

          {/* Active Terminal Output */}
          <div className="lg:col-span-7 flex flex-col h-[520px] bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl">
            {/* Terminal Header */}
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-850">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-accent" />
                <span className="text-xs font-mono text-slate-350 font-bold">Compiler Console Terminal</span>
              </div>
              <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              </div>
            </div>

            {/* Terminal Output Body */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-slate-300 space-y-2 select-text">
              {consoleLogs.map((log, index) => {
                let logClass = "text-slate-300";
                if (log.includes('[SUCCESS]')) logClass = "text-success font-bold";
                else if (log.includes('[WARN]')) logClass = "text-warning";
                else if (log.includes('[DISCOVER]')) logClass = "text-slate-450";
                else if (log.includes('[AGENT]')) logClass = "text-indigo-400";
                else if (log.includes('[LIGHTHOUSE]')) logClass = "text-amber-400";
                else if (log.includes('[HEURISTICS]')) logClass = "text-purple-400";
                
                return (
                  <div key={index} className={`flex items-start ${logClass}`}>
                    <span className="text-slate-600 select-none mr-3">{String(index + 1).padStart(2, '0')}</span>
                    <span>{log}</span>
                  </div>
                );
              })}
              
              {!isFinished && (
                <div className="flex items-center text-accent animate-pulse mt-2 select-none">
                  <span className="w-2 h-4 bg-accent mr-2"></span>
                  <span>Executing active routine...</span>
                </div>
              )}

              {isFinished && (
                <div className="flex items-center text-success mt-4 p-3 bg-success/5 border border-success/20 rounded-lg">
                  <ShieldCheck className="w-5 h-5 mr-2 shrink-0" />
                  <span>Website audit has been successfully processed! Dashboard is loaded.</span>
                </div>
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>

        </div>

      </div>
    </MainLayout>
  );
};
export default ProgressPage;
