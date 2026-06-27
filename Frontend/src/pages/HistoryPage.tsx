import React from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { mockHistory } from '../mock/auditData';
import { History, ArrowUpRight, Search, Globe, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRowClick = (url: string) => {
    navigate(`/progress?url=${encodeURIComponent(url)}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 text-left">
        
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white flex items-center">
            Scan Audit History
            <span className="ml-3 inline-flex items-center text-[10px] tracking-wide font-extrabold uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
              <History className="w-3.5 h-3.5 mr-1" />
              Log History
            </span>
          </h2>
          <p className="text-slate-400 text-sm">Review previous audit runs, compare score drops, and re-launch scanner instances.</p>
        </div>

        {/* History Table */}
        <div className="bg-card border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-5 bg-slate-900 border-b border-slate-850 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historical Scans ({mockHistory.length})</span>
            <span className="text-xs text-slate-500 font-mono">Click row to re-execute</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 border-b border-slate-850 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold select-none">
                  <th className="py-4 px-6">Domain URL</th>
                  <th className="py-4 px-6">Execution Date</th>
                  <th className="py-4 px-6">Pages Crawled</th>
                  <th className="py-4 px-6">UX Score Index</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs">
                {mockHistory.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleRowClick(item.url)}
                    className="hover:bg-slate-900/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-4.5 px-6 font-semibold text-slate-200 flex items-center">
                      <Globe className="w-4 h-4 text-slate-500 mr-2 group-hover:text-accent transition-colors" />
                      {item.url}
                    </td>
                    <td className="py-4.5 px-6 text-slate-450 font-mono">{item.date}</td>
                    <td className="py-4.5 px-6 text-slate-450 font-mono">{item.pagesCount} pages</td>
                    <td className="py-4.5 px-6">
                      <span className={`inline-flex items-center text-[11px] font-extrabold px-2 py-0.5 rounded ${
                        item.score >= 80 ? 'bg-success/10 text-success' : item.score >= 60 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                      }`}>
                        {item.score}/100
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right">
                      <button className="text-slate-500 group-hover:text-accent font-semibold flex items-center justify-end space-x-1 w-full text-right transition-colors">
                        <span>Re-audit</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};
export default HistoryPage;
