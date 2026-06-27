import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileBarChart2, 
  MessageSquare, 
  GitMerge, 
  History,
  ShieldCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'User Journey', path: '/journey', icon: <GitMerge className="w-4 h-4" /> },
    { name: 'Reports', path: '/report', icon: <FileBarChart2 className="w-4 h-4" /> },
    { name: 'AI Assistant', path: '/assistant', icon: <MessageSquare className="w-4 h-4" /> },
    { name: 'Scan History', path: '/history', icon: <History className="w-4 h-4" /> }
  ];

  return (
    <aside className="w-64 h-[calc(100vh-73px)] sticky top-[73px] bg-[#F8FAFC] border-r border-slate-200/80 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Navigation Items */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-205 ${
                  isActive 
                    ? 'bg-accent/10 text-accent border-l-4 border-accent shadow-glass-glow' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className={`transition-colors duration-200 ${isActive ? 'text-accent' : 'text-slate-450'}`}>
                  {item.icon}
                </div>
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Domain overview visual card */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Domain</span>
          <span className="w-2 h-2 rounded-full bg-success"></span>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-800 block truncate">shoppycart.io</span>
          <span className="text-[10px] text-slate-450 block truncate">Report updated 10m ago</span>
        </div>
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 text-success mr-1" />
            100% Secure
          </span>
        </div>
      </div>
    </aside>
  );
};
