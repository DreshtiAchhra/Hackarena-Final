import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProgressTimeline, TimelineStep } from '../components/ProgressTimeline';
import { Terminal, ShieldCheck, Cpu, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiscovery } from '../hooks/useDiscovery';
import { useBrowserAgent } from '../hooks/useBrowserAgent';

export const ProgressPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetUrl = searchParams.get('url') || '';
  
  const { startDiscovery } = useDiscovery();
  const { startBrowserCapture } = useBrowserAgent();

  const [activeStep, setActiveStep] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const [steps, setSteps] = useState<TimelineStep[]>([
    { name: 'Discovering Website', description: 'Probing sitemap index and crawling routes list', status: 'running' },
    { name: 'Crawling Pages', description: 'Compiling list of discovered sitemap targets', status: 'waiting' },
    { name: 'Rendering Website', description: 'Booting Chromium context and resolving JavaScript', status: 'waiting' },
    { name: 'Extracting Metadata', description: 'Parsing visual CSS sheets and header titles', status: 'waiting' },
    { name: 'Capturing Screenshots', description: 'Taking full-page screenshot maps for visual audit', status: 'waiting' },
    { name: 'Report Ready', description: 'Compiling discovery manifest results database', status: 'waiting' }
  ]);

  // Append logs helper
  const addLog = (msg: string) => {
    setConsoleLogs(prev => [...prev, msg]);
  };

  // Run the API pipeline
  useEffect(() => {
    if (!targetUrl) {
      setPipelineError("Target URL query is missing. Return to home to enter a domain.");
      return;
    }

    const runPipeline = async () => {
      // ── Stage 1: Discovery ──────────────────────────────────────────
      addLog(`[DISCOVER] Connecting to target seed: ${targetUrl}`);
      addLog(`[DISCOVER] Dispatching page crawler threads...`);
      
      const discoveryResult = await startDiscovery(targetUrl);
      
      if (!discoveryResult) {
        setPipelineError("Discovery step failed. Please check if the URL is valid and the backend server is running.");
        return;
      }

      setSteps(prev => {
        const next = [...prev];
        next[0].status = 'completed';
        next[1].status = 'running';
        return next;
      });
      setActiveStep(1);

      addLog(`[DISCOVER] Sitemap detected: ${discoveryResult.sitemap_found ? 'YES' : 'NO'}`);
      addLog(`[DISCOVER] Crawl crawler used: ${discoveryResult.crawl_used ? 'YES' : 'NO'}`);
      addLog(`[DISCOVER] Successfully identified ${discoveryResult.total_discovered} pages.`);
      
      const discoveredUrls = discoveryResult.pages.map(p => p.url);
      
      // Print top discovered URLs
      discoveredUrls.slice(0, 5).forEach((url, i) => {
        addLog(`[DISCOVER] Page #${i+1} found: ${url}`);
      });
      if (discoveredUrls.length > 5) {
        addLog(`[DISCOVER] ... and ${discoveredUrls.length - 5} more pages.`);
      }

      setSteps(prev => {
        const next = [...prev];
        next[1].status = 'completed';
        next[2].status = 'running';
        return next;
      });
      setActiveStep(2);

      // ── Stage 2: Browser Capture ────────────────────────────────────
      addLog(`[AGENT] Spawning Chromium headless agent context...`);
      addLog(`[AGENT] Gating execution queue (max workers: 3)`);
      addLog(`[AGENT] Initiating capture for ${discoveredUrls.length} pages...`);

      // Let's cap the URLs to capture at 6 for speed during user scans
      const urlsToCapture = discoveredUrls.slice(0, 6);
      if (discoveredUrls.length > 6) {
        addLog(`[AGENT] Capping full-page rendering at top 6 pages for speed index.`);
      }

      const captureResult = await startBrowserCapture(urlsToCapture);

      if (!captureResult) {
        setPipelineError("Headless Browser rendering step failed. Playwright processes failed to initialize.");
        return;
      }

      setSteps(prev => {
        const next = [...prev];
        next[2].status = 'completed';
        next[3].status = 'running';
        return next;
      });
      setActiveStep(3);

      addLog(`[AGENT] Playwright context done. Total: ${captureResult.total_pages} pages processed.`);
      addLog(`[AGENT] Captures succeeded: ${captureResult.successful} | Failed: ${captureResult.failed}`);

      setSteps(prev => {
        const next = [...prev];
        next[3].status = 'completed';
        next[4].status = 'running';
        return next;
      });
      setActiveStep(4);

      // Log details of each page capture
      captureResult.captures.forEach((cap) => {
        const statusIcon = cap.status === 'ok' ? '✔' : '✖';
        addLog(`[AGENT] ${statusIcon} Captured: ${cap.url} (${cap.load_time_ms}ms)`);
        if (cap.status === 'ok') {
          addLog(`        Title: "${cap.title}" | HTML: ${cap.html_path ? 'saved' : 'failed'} | CSS: ${cap.css_path ? 'saved' : 'failed'}`);
        }
      });

      setSteps(prev => {
        const next = [...prev];
        next[4].status = 'completed';
        next[5].status = 'running';
        return next;
      });
      setActiveStep(5);

      addLog(`[MANIFEST] Writing manifest.json to ${captureResult.output_dir}`);
      addLog(`[SUCCESS] Pipeline successfully completed. Initializing dashboard layout.`);

      // ── Stage 3: Cache results for Dashboard loading ───────────────
      localStorage.setItem('audit_url', targetUrl);
      localStorage.setItem('discovery_result', JSON.stringify(discoveryResult));
      localStorage.setItem('browser_result', JSON.stringify(captureResult));

      setSteps(prev => {
        const next = [...prev];
        next[5].status = 'completed';
        return next;
      });
      setActiveStep(6);
    };

    runPipeline();
  }, [targetUrl]);

  // Autoscroll terminal
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  const isFinished = activeStep >= steps.length;

  return (
    <MainLayout>
      <div className="py-8 max-w-5xl mx-auto space-y-8 text-left">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 flex items-center">
              <Cpu className="w-6 h-6 text-accent mr-2 animate-spin" style={{ animationDuration: '6s' }} />
              API Integration Pipeline
            </h2>
            <p className="text-slate-500 text-xs font-mono">Target: {targetUrl}</p>
          </div>

          <AnimatePresence>
            {isFinished && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-success hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-md shadow-success/20 self-start"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Pipeline Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Stepper Pipeline */}
          <div className="lg:col-span-5 bg-card border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Pipeline Stages</h3>
            <ProgressTimeline steps={steps} />
          </div>

          {/* Active Terminal Output */}
          <div className="lg:col-span-7 flex flex-col h-[520px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Terminal Header */}
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-accent" />
                <span className="text-xs font-mono text-slate-300 font-bold">Compiler Console Terminal</span>
              </div>
              <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
              </div>
            </div>

            {/* Terminal Output Body */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-slate-350 space-y-2 select-text">
              {consoleLogs.map((log, index) => {
                let logClass = "text-slate-300";
                if (log.includes('[SUCCESS]')) logClass = "text-success font-bold";
                else if (log.includes('[ERROR]') || log.includes('[FAIL]')) logClass = "text-danger";
                else if (log.includes('[DISCOVER]')) logClass = "text-slate-400";
                else if (log.includes('[AGENT]')) logClass = "text-indigo-400";
                else if (log.includes('[MANIFEST]')) logClass = "text-amber-400";
                
                return (
                  <div key={index} className={`flex items-start ${logClass}`}>
                    <span className="text-slate-650 select-none mr-3">{String(index + 1).padStart(2, '0')}</span>
                    <span>{log}</span>
                  </div>
                );
              })}
              
              {!isFinished && !pipelineError && (
                <div className="flex items-center text-accent animate-pulse mt-2 select-none">
                  <span className="w-2 h-4 bg-accent mr-2"></span>
                  <span>Executing active API routine...</span>
                </div>
              )}

              {pipelineError && (
                <div className="flex items-start text-danger mt-4 p-4 bg-danger/5 border border-danger/25 rounded-lg space-x-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold">Execution Error Encountered</span>
                    <p className="text-xs text-slate-400">{pipelineError}</p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-2 text-xs font-bold text-accent hover:underline flex items-center"
                    >
                      Retry Connection Pipeline
                    </button>
                  </div>
                </div>
              )}

              {isFinished && (
                <div className="flex items-center text-success mt-4 p-3 bg-success/5 border border-success/20 rounded-lg">
                  <ShieldCheck className="w-5 h-5 mr-2 shrink-0" />
                  <span>Website discovery crawler and browser agent captures successfully mapped! Dashboard is active.</span>
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
