import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { mockHistory } from '../mock/auditData';
import { History, Globe, ChevronRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  // Local state to manage history row deletions dynamically
  const [historyData, setHistoryData] = useState(mockHistory);

  const handleRowClick = (url: string) => {
    navigate(`/progress?url=${encodeURIComponent(url)}`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering navigation to progress page when deleting row
    setHistoryData(prev => prev.filter(item => item.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 text-left">
        
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 flex items-center">
            Scan Audit History
            <span className="ml-3 inline-flex items-center text-[10px] tracking-wide font-extrabold uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
              <History className="w-3.5 h-3.5 mr-1" />
              Log History
            </span>
          </h2>
          <p className="text-slate-800 text-sm font-semibold">Review previous audit runs, compare score drops, and re-launch scanner instances.</p>
        </div>

        {/* History Table */}
        <div className="bg-card border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Historical Scans ({historyData.length})</span>
            <span className="text-xs text-slate-800 font-mono font-bold">Click row to re-execute • Click dustbin to delete</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-55/50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-800 font-black select-none">
                  <th className="py-4 px-6">Domain URL</th>
                  <th className="py-4 px-6">Execution Date</th>
                  <th className="py-4 px-6">Pages Crawled</th>
                  <th className="py-4 px-6">UX Score Index</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {historyData.length > 0 ? (
                  historyData.map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => handleRowClick(item.url)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="py-4.5 px-6 font-bold text-slate-900 flex items-center">
                        <Globe className="w-4 h-4 text-slate-600 mr-2 group-hover:text-accent transition-colors" />
                        {item.url}
                      </td>
                      <td className="py-4.5 px-6 text-slate-800 font-mono font-semibold">{item.date}</td>
                      <td className="py-4.5 px-6 text-slate-800 font-mono font-semibold">{item.pagesCount} pages</td>
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex items-center text-[11px] font-extrabold px-2 py-0.5 rounded ${
                          item.score >= 80 ? 'bg-success/10 text-success' : item.score >= 60 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                        }`}>
                          {item.score}/100
                        </span>
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="flex items-center justify-end space-x-3">
                          <button className="text-slate-700 group-hover:text-accent font-bold flex items-center justify-end space-x-1 transition-colors">
                            <span>Re-audit</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          
                          {/* Trash Delete Button */}
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 text-danger hover:bg-danger/10 hover:text-red-750 rounded-lg transition-colors border border-transparent hover:border-danger/20 shrink-0"
                            title="Delete log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 px-6 text-center text-slate-600 font-bold text-sm">
                      No historical scans remain. Enter a URL on the landing page to begin.
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
export default HistoryPage;
