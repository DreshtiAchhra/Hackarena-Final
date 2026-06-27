import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { MetricCard } from '../components/MetricCard';
import { ScoreRing } from '../components/ScoreRing';
import { EmptyState } from '../components/EmptyState';
import { 
  SeverityDistributionChart, 
  CategoryDistributionChart, 
  PagesAuditedChart 
} from '../components/ChartCards';
import { DiscoveryResult, BrowserAgentResult, PageCapture } from '../types/backend';
import axios from 'axios';
import { 
  Globe, 
  Layers, 
  Clock, 
  FileText, 
  AlertOctagon, 
  Sparkles,
  RefreshCw,
  Code,
  FileCode,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [discoveryData, setDiscoveryData] = useState<DiscoveryResult | null>(null);
  const [browserData, setBrowserData] = useState<BrowserAgentResult | null>(null);
  const [selectedCapture, setSelectedCapture] = useState<PageCapture | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [cssContent, setCssContent] = useState<string>('');
  const [loadingHtml, setLoadingHtml] = useState<boolean>(false);
  const [loadingCss, setLoadingCss] = useState<boolean>(false);
  const [showHtml, setShowHtml] = useState<boolean>(false);
  const [showCss, setShowCss] = useState<boolean>(false);

  // Load results from storage
  useEffect(() => {
    const rawDisc = localStorage.getItem('discovery_result');
    const rawBrowser = localStorage.getItem('browser_result');

    if (rawDisc) setDiscoveryData(JSON.parse(rawDisc));
    if (rawBrowser) {
      const parsedBrowser: BrowserAgentResult = JSON.parse(rawBrowser);
      setBrowserData(parsedBrowser);
      if (parsedBrowser.captures && parsedBrowser.captures.length > 0) {
        setSelectedCapture(parsedBrowser.captures[0]);
      }
    }
  }, []);

  // Normalize backend file paths (Windows/Linux) to HTTP static URLs
  const getFileUrl = (path?: string) => {
    if (!path) return '';
    const normalized = path.replace(/\\/g, '/');
    const idx = normalized.indexOf('captures/');
    if (idx !== -1) {
      return `http://localhost:8000/${normalized.substring(idx)}`;
    }
    return `http://localhost:8000/${normalized}`;
  };

  // Fetch HTML code content statically
  useEffect(() => {
    if (!selectedCapture || !selectedCapture.html_path) {
      setHtmlContent('');
      return;
    }
    const fetchHtml = async () => {
      setLoadingHtml(true);
      try {
        const url = getFileUrl(selectedCapture.html_path);
        const res = await axios.get(url);
        setHtmlContent(res.data);
      } catch (e) {
        setHtmlContent('Failed to load rendered HTML file from backend static server.');
      } finally {
        setLoadingHtml(false);
      }
    };
    fetchHtml();
  }, [selectedCapture]);

  // Fetch CSS styles content statically
  useEffect(() => {
    if (!selectedCapture || !selectedCapture.css_path) {
      setCssContent('');
      return;
    }
    const fetchCss = async () => {
      setLoadingCss(true);
      try {
        const url = getFileUrl(selectedCapture.css_path);
        const res = await axios.get(url);
        setCssContent(res.data);
      } catch (e) {
        setCssContent('Failed to load extracted CSS styles file from backend static server.');
      } finally {
        setLoadingCss(false);
      }
    };
    fetchCss();
  }, [selectedCapture]);

  if (!discoveryData || !browserData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <EmptyState 
            title="No audit data active"
            description="You have not crawled a website yet. Enter a target domain URL on the landing home page to spawn chromium nodes."
            actionText="Start Scanning"
            onAction={() => navigate('/')}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Aggregate dashboard stats
  const totalPages = discoveryData.total_discovered;
  const siteUrl = discoveryData.seed_url;
  const totalSuccess = browserData.successful;
  const totalFailed = browserData.failed;
  const averageLoadTime = browserData.captures.length > 0 
    ? Math.round(browserData.captures.reduce((acc, c) => acc + (c.load_time_ms || 0), 0) / browserData.captures.length)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 text-left">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 flex items-center">
              Auditor Live Dashboard
              <span className="ml-3 inline-flex items-center text-[10px] tracking-wide font-extrabold uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
                Live Integration
              </span>
            </h2>
            <p className="text-slate-500 text-sm">Inspecting pages, Chromium Playwright renders, metadata files, and screenshot paths in real-time.</p>
          </div>
          <button 
            onClick={() => navigate(`/progress?url=${encodeURIComponent(siteUrl)}`)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-accent hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors self-start shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-run Discovery</span>
          </button>
        </div>

        {/* Website Overview Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Website URL" 
            value={siteUrl.replace('https://', '').replace('http://', '')} 
            subtext="Target Domain"
            icon={<Globe className="w-4 h-4 text-accent" />}
          />
          <MetricCard 
            title="Pages Discovered" 
            value={totalPages} 
            subtext="Dynamic crawler paths traced"
            icon={<Layers className="w-4 h-4 text-emerald-500" />}
          />
          <MetricCard 
            title="Avg Browser Render Time" 
            value={`${averageLoadTime}ms`} 
            subtext="Chromium DOM load speed"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <MetricCard 
            title="Sitemap Detected" 
            value={discoveryData.sitemap_found ? "YES" : "NO"} 
            subtext={discoveryData.crawl_used ? "BFS crawl fallback used" : "Read sitemap priority"}
            icon={<FileText className="w-4 h-4 text-indigo-500" />}
          />
        </div>

        {/* Status Indicators Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Captures Succeeded */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Browser Captures OK</span>
              <span className="text-2xl font-black text-emerald-600">{totalSuccess} pages</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Captures Failed */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Browser Captures Failed</span>
              <span className="text-2xl font-black text-red-650">{totalFailed} pages</span>
            </div>
            <div className="p-3 bg-red-50 text-red-650 rounded-full">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Future metrics placeholder card */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Lighthouse Compliance (Placeholder)</span>
              <span className="text-2xl font-black text-accent">Pending</span>
            </div>
            <div className="p-3 bg-indigo-50 text-accent rounded-full">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* Real-time Discovery Crawler list & Browser Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Discovered Pages table */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Discovered Page Nodes</h3>
              <span className="text-xs font-mono text-slate-500 font-bold">{discoveryData.pages.length} URLs</span>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-h-[580px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500 font-extrabold tracking-wider select-none">
                    <th className="py-3 px-4">Discovered Route</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {discoveryData.pages.map((p) => {
                    const hasCapture = browserData.captures.find(c => c.url === p.url);
                    const isSelected = selectedCapture?.url === p.url;
                    
                    return (
                      <tr 
                        key={p.url} 
                        onClick={() => {
                          if (hasCapture) {
                            setSelectedCapture(hasCapture);
                            setShowHtml(false);
                            setShowCss(false);
                          }
                        }}
                        className={`transition-colors ${
                          hasCapture ? 'cursor-pointer hover:bg-slate-50/50' : 'opacity-50 select-none'
                        } ${isSelected ? 'bg-accent/5 font-bold text-accent' : ''}`}
                      >
                        <td className="py-3.5 px-4 truncate max-w-[200px]" title={p.url}>
                          {p.url.replace(siteUrl, '/')}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded border uppercase ${
                            p.method === 'sitemap' ? 'bg-indigo-50 border-indigo-200 text-accent' : 'bg-slate-50 border-slate-200 text-slate-650'
                          }`}>
                            {p.method}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">{p.priority}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel: Browser Agent inspector (Screenshot, HTML, CSS, Manifest) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Playwright Inspector</h3>
              {selectedCapture && (
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  selectedCapture.status === 'ok' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}>
                  {selectedCapture.status === 'ok' ? 'Render Succeeded' : 'Render Failed'}
                </span>
              )}
            </div>

            {selectedCapture ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6 shadow-sm">
                
                {/* Visual Capture Info block */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-left shadow-sm">
                    <span className="text-[10px] text-slate-450 uppercase block font-bold">Load Speed</span>
                    <span className="text-sm font-black text-slate-800 mt-1 block">{selectedCapture.load_time_ms} ms</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-left shadow-sm">
                    <span className="text-[10px] text-slate-450 uppercase block font-bold">Height</span>
                    <span className="text-sm font-black text-slate-800 mt-1 block">{selectedCapture.page_height_px} px</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-left shadow-sm col-span-2">
                    <span className="text-[10px] text-slate-450 uppercase block font-bold">Resolved Page Title</span>
                    <span className="text-xs font-bold text-slate-800 mt-1 block truncate" title={selectedCapture.title || ''}>
                      {selectedCapture.title || 'Untitled'}
                    </span>
                  </div>
                </div>

                {/* Screenshot view */}
                {selectedCapture.screenshot_path ? (
                  <div className="space-y-2 text-left">
                    <span className="text-xs font-bold text-slate-500 flex items-center">
                      <ImageIcon className="w-3.5 h-3.5 mr-1 text-accent" />
                      Playwright Full-Page Screenshot
                    </span>
                    <div className="w-full max-h-[300px] border border-slate-200 rounded-xl overflow-y-auto bg-slate-100 p-2 shadow-inner relative group">
                      <img 
                        src={getFileUrl(selectedCapture.screenshot_path)} 
                        alt={`Screenshot of ${selectedCapture.url}`}
                        className="w-full object-top object-cover rounded-lg"
                      />
                      <div className="absolute top-4 right-4 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-slate-800 shadow opacity-0 group-hover:opacity-100 transition-opacity">
                        Scroll Image
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span>No screenshot captured for this node.</span>
                  </div>
                )}

                {/* Expandable Rendered HTML & CSS code panels */}
                <div className="space-y-3">
                  
                  {/* HTML Inspector */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setShowHtml(!showHtml)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className="text-xs font-bold text-slate-700 flex items-center">
                        <Code className="w-4 h-4 mr-2 text-accent" />
                        View Rendered HTML DOM code (Post-JS Execution)
                      </span>
                      <span className="text-xs text-accent font-semibold">{showHtml ? 'Collapse' : 'Expand'}</span>
                    </button>
                    {showHtml && (
                      <div className="border-t border-slate-200 bg-slate-950 p-4 max-h-[240px] overflow-y-auto text-left font-mono text-[11px] text-indigo-300 overflow-x-auto code-preview">
                        {loadingHtml ? (
                          <div className="text-slate-500 animate-pulse">Requesting DOM file from static server...</div>
                        ) : (
                          <pre>{htmlContent || 'No DOM file content.'}</pre>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CSS Inspector */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setShowCss(!showCss)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className="text-xs font-bold text-slate-700 flex items-center">
                        <FileCode className="w-4 h-4 mr-2 text-purple-600" />
                        View Extracted stylesheet CSS Rules
                      </span>
                      <span className="text-xs text-accent font-semibold">{showCss ? 'Collapse' : 'Expand'}</span>
                    </button>
                    {showCss && (
                      <div className="border-t border-slate-200 bg-slate-950 p-4 max-h-[240px] overflow-y-auto text-left font-mono text-[11px] text-indigo-300 overflow-x-auto code-preview">
                        {loadingCss ? (
                          <div className="text-slate-500 animate-pulse">Requesting styles file from static server...</div>
                        ) : (
                          <pre>{cssContent || 'No extracted styles rules.'}</pre>
                        )}
                      </div>
                    )}
                  </div>

                </div>

                {/* Raw Manifest Details */}
                <div className="p-4 bg-white border border-slate-250 rounded-xl text-left space-y-2 shadow-sm">
                  <span className="text-[10px] text-slate-450 uppercase font-black block">Raw Browser Manifest (manifest.json)</span>
                  <div className="max-h-[140px] overflow-y-auto font-mono text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 overflow-x-auto">
                    <pre>{JSON.stringify(selectedCapture, null, 2)}</pre>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 border border-slate-200 bg-slate-50 rounded-2xl text-center text-slate-400 text-sm">
                Select a page node from the sitemap list to inspect captures.
              </div>
            )}

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};
export default Dashboard;
