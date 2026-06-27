import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
      {/* Brand logo */}
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent to-purple-600 flex items-center justify-center shadow-md shadow-accent-glow/20 group-hover:scale-105 transition-transform duration-200">
            <Cpu className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-slate-800 group-hover:text-accent transition-colors duration-200">
              UX Auditor
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-450 font-bold -mt-1">
              Conversational Engine
            </span>
          </div>
        </Link>
      </div>

      {/* Center metadata / status badge */}
      <div className="hidden md:flex items-center space-x-6">
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs text-slate-600">
          <div className="w-2 h-2 rounded-full bg-success animate-ping"></div>
          <span className="font-mono text-slate-700">Discovery Engine: Ready</span>
        </div>
      </div>

      {/* Right control buttons */}
      <div className="flex items-center space-x-3.5">
        <button 
          onClick={() => navigate('/dashboard')}
          className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors py-2 px-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200"
        >
          <Eye className="w-4 h-4" />
          <span>Active Audits</span>
        </button>

        <Link
          to="/assistant"
          className="flex items-center space-x-1.5 px-4 py-2 bg-accent hover:bg-blue-750 text-white text-xs font-bold rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-md shadow-accent-glow"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Consult AI</span>
        </Link>
      </div>
    </nav>
  );
};
