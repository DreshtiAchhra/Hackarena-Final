import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { MetricCard } from '../components/MetricCard';
import { ScoreRing } from '../components/ScoreRing';
import { IssueCard } from '../components/IssueCard';
import { Loader } from '../components/Loader';
import { 
  SeverityDistributionChart, 
  CategoryDistributionChart, 
  PagesAuditedChart 
} from '../components/ChartCards';
import { auditService } from '../services/api';
import { AuditReport } from '../types';
import { 
  Globe, 
  Layers, 
  Clock, 
  FileText, 
  AlertOctagon, 
  Sparkles,
  RefreshCw 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    const data = await auditService.getReport('https://www.shoppycart.io');
    setReport(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading || !report) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader message="Fetching audit dashboard data..." submessage="Parsing accessibility records and mapping sitemap nodes" />
        </div>
      </DashboardLayout>
    );
  }

  const { metadata, issues } = report;

  return (
    <DashboardLayout>
      <div className="space-y-8 text-left">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white flex items-center">
              Auditor Dashboard
              <span className="ml-3 inline-flex items-center text-[10px] tracking-wide font-extrabold uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
                Live Analysis
              </span>
            </h2>
            <p className="text-slate-400 text-sm">Real-time usability telemetry, Lighthouse indexes, and screen compliance violations.</p>
          </div>
          <button 
            onClick={fetchReport}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-350 text-xs font-bold rounded-lg border border-slate-800 transition-colors self-start"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-run Audits</span>
          </button>
        </div>

        {/* Website Overview Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Website URL" 
            value={metadata.url.replace('https://www.', '')} 
            subtext="Target Domain"
            icon={<Globe className="w-4 h-4 text-accent" />}
          />
          <MetricCard 
            title="Total Pages Audited" 
            value={metadata.totalPages} 
            subtext="Dynamic crawler paths traced"
            icon={<Layers className="w-4 h-4 text-emerald-500" />}
          />
          <MetricCard 
            title="Audit Completion Time" 
            value={metadata.auditTime} 
            subtext="Browser agent scan time"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <MetricCard 
            title="Sitemap Coverage" 
            value={metadata.coverage} 
            subtext="Calculated routing index"
            icon={<FileText className="w-4 h-4 text-indigo-500" />}
          />
        </div>

        {/* Score Ring Section (Metric gauges) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ScoreRing score={metadata.accessibilityScore} label="Accessibility Score" />
          <ScoreRing score={metadata.uxScore} label="UX Usability Score" />
          <ScoreRing score={metadata.performanceScore} label="Lighthouse Performance" />
          
          {/* Critical Count Metric card */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80">
            <div className="w-20 h-20 rounded-full bg-danger/10 border-2 border-danger/25 flex items-center justify-center mb-3">
              <AlertOctagon className="w-10 h-10 text-danger animate-pulse" />
            </div>
            <span className="text-3xl font-black text-white">{metadata.criticalCount}</span>
            <span className="text-sm font-semibold text-slate-300 mt-2">Critical Violations</span>
            <span className="text-[10px] text-slate-500 uppercase font-extrabold mt-1 text-center">Requires immediate resolution</span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SeverityDistributionChart />
          </div>
          <div className="lg:col-span-1">
            <CategoryDistributionChart />
          </div>
          <div className="lg:col-span-1">
            <PagesAuditedChart />
          </div>
        </div>

        {/* Top Critical Findings */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-200">Recent Critical Findings</h3>
            <span className="text-xs text-slate-500 font-mono">Showing top 4 issues</span>
          </div>
          
          <div className="space-y-4">
            {issues.slice(0, 4).map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};
export default Dashboard;
