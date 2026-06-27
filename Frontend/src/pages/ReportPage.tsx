import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { SeverityDistributionChart, CategoryDistributionChart } from '../components/ChartCards';
import { mockMetadata, mockIssues } from '../mock/auditData';
import { DiscoveryResult } from '../types/backend';
import { 
  Download, 
  FileJson, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [exportNotification, setExportNotification] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });
  const [discoveryData, setDiscoveryData] = useState<DiscoveryResult | null>(null);

  // Load results from storage
  useEffect(() => {
    const rawDisc = localStorage.getItem('discovery_result');
    if (rawDisc) setDiscoveryData(JSON.parse(rawDisc));
  }, []);

  // Filter issues based on selections
  const filteredIssues = mockIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.pageUrl.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || issue.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    return matchesSearch && matchesSeverity && matchesCategory;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-danger/10 border border-danger/25 text-danger"><AlertCircle className="w-3 h-3 mr-1" />Critical</span>;
      case 'warning':
        return <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-warning/10 border border-warning/25 text-warning"><AlertTriangle className="w-3 h-3 mr-1" />Warning</span>;
      default:
        return <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">Info</span>;
    }
  };

  const getCleanDomain = (url: string) => {
    return url.replace('https://', '').replace('http://', '').split('/')[0];
  };

  const simulateExport = (type: 'pdf' | 'json') => {
    const activeUrl = discoveryData?.seed_url || 'shoppycart.io';
    
    setExportNotification({
      show: true,
      msg: `Generating and compiling ${type.toUpperCase()} package...`
    });

    setTimeout(() => {
      const element = document.createElement("a");
      const dataStr = type === 'json'
        ? "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ metadata: mockMetadata, issues: mockIssues }, null, 2))
        : "data:text/plain;charset=utf-8," + encodeURIComponent("Conversational UX Auditor Executive Summary Report\nDomain: " + activeUrl + "\nAccessibility: " + mockMetadata.accessibilityScore + "\nUX Score: " + mockMetadata.uxScore);
      
      element.setAttribute("href", dataStr);
      element.setAttribute("download", `ux_audit_report_${getCleanDomain(activeUrl)}.${type}`);
      document.body.appendChild(element);
      element.click();
      element.remove();

      setExportNotification({
        show: true,
        msg: `Downloaded ux_audit_report.${type} successfully!`
      });

      // Clear after 3 seconds
      setTimeout(() => setExportNotification({ show: false, msg: '' }), 3000);
    }, 1500);
  };

  const activeUrl = discoveryData?.seed_url || 'shoppycart.io';
  const totalPages = discoveryData?.total_discovered || mockMetadata.totalPages;

  return (
    <DashboardLayout>
      <div className="space-y-8 text-left relative">
        
        {/* Export toasts / status notifications */}
        {exportNotification.show && (
          <div className="fixed bottom-6 right-6 z-50 p-4 bg-white border border-accent rounded-xl shadow-md flex items-center space-x-3 text-sm text-slate-800 animate-bounce">
            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-ping"></div>
            <span>{exportNotification.msg}</span>
          </div>
        )}

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 flex items-center">
              Executive Audit Report
              <span className="ml-3 inline-flex items-center text-[10px] tracking-wide font-extrabold uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                Full Summary
              </span>
            </h2>
            <p className="text-slate-500 text-sm">Download official report logs or inspect category violations lists.</p>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center space-x-3 self-start">
            <button
              onClick={() => simulateExport('json')}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors shadow-sm"
            >
              <FileJson className="w-4 h-4 text-accent" />
              <span>Export JSON</span>
            </button>
            
            <button
              onClick={() => simulateExport('pdf')}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-accent hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Export PDF Report</span>
            </button>
          </div>
        </div>

        {/* Executive Summary Metrics Card */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-6 items-center shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Executive Rating</span>
            <h3 className="text-xl font-black text-slate-800 truncate" title={activeUrl}>{getCleanDomain(activeUrl)}</h3>
            <span className="text-xs text-slate-500">Index updated: June 27, 2026</span>
          </div>
          
          <div className="flex items-center space-x-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-150">
            <div className="text-center">
              <span className="text-xs text-slate-500 block">Accessibility</span>
              <span className="text-xl font-black text-warning mt-0.5 block">{mockMetadata.accessibilityScore}%</span>
            </div>
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-warning rounded-full" style={{ width: `${mockMetadata.accessibilityScore}%` }}></div>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-150">
            <div className="text-center">
              <span className="text-xs text-slate-500 block">UX Heuristics</span>
              <span className="text-xl font-black text-danger mt-0.5 block">{mockMetadata.uxScore}%</span>
            </div>
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-danger rounded-full" style={{ width: `${mockMetadata.uxScore}%` }}></div>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-150">
            <div className="text-center">
              <span className="text-xs text-slate-500 block">Pages Audited</span>
              <span className="text-xl font-black text-indigo-600 mt-0.5 block">{totalPages}</span>
            </div>
            <div className="flex-1 text-right">
              <span className="text-[10px] text-slate-500 font-mono block">Coverage</span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">{mockMetadata.coverage}</span>
            </div>
          </div>
        </div>

        {/* Charts summary row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SeverityDistributionChart />
          <CategoryDistributionChart />
        </div>

        {/* Issues list & search database */}
        <div className="bg-card border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          
          {/* Table Toolbar */}
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            
            {/* Search Input */}
            <div className="flex items-center space-x-2.5 px-3 py-2 bg-white border border-slate-200 rounded-lg focus-within:border-accent transition-colors flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search issues, pages, or elements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-0 outline-none text-slate-800 text-xs placeholder-slate-400 w-full"
              />
            </div>

            {/* Selector Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span className="text-xs">Filter:</span>
              </div>
              
              {/* Severity Selector */}
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs py-2 px-3.5 rounded-lg focus:border-accent outline-none"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical Only</option>
                <option value="warning">Warning Only</option>
                <option value="info">Info Only</option>
              </select>

              {/* Category Selector */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs py-2 px-3.5 rounded-lg focus:border-accent outline-none"
              >
                <option value="all">All Categories</option>
                <option value="accessibility">Accessibility</option>
                <option value="usability">Usability</option>
                <option value="performance">Performance</option>
                <option value="seo">SEO</option>
              </select>
            </div>

          </div>

          {/* Interactive Issues Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-650 font-extrabold select-none">
                  <th className="py-4 px-6">Violation ID</th>
                  <th className="py-4 px-6">Description Summary</th>
                  <th className="py-4 px-6">Severity</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6 text-right">Target Route</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredIssues.length > 0 ? (
                  filteredIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4.5 px-6 font-mono text-slate-500 font-semibold">{issue.id}</td>
                      <td className="py-4.5 px-6">
                        <span className="font-bold text-slate-800 block mb-0.5">{issue.title}</span>
                        <span className="text-slate-500 line-clamp-1">{issue.description}</span>
                      </td>
                      <td className="py-4.5 px-6">{getSeverityBadge(issue.severity)}</td>
                      <td className="py-4.5 px-6">
                        <span className="text-[10px] uppercase font-bold text-slate-650 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {issue.category}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-right font-mono text-slate-500">{issue.pageUrl}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 px-6 text-center text-slate-500 font-medium">
                      No violations found matching the selected query parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};
export default ReportPage;
