import React from 'react';
import { Navbar } from '../components/Navbar';
import { motion } from 'framer-motion';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar />

      {/* Main content body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 relative">
        {/* Soft floating background glow bubbles */}
        <div className="absolute top-10 left-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/80 bg-slate-950/40 text-center text-xs text-slate-500 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; 2026 Conversational UX Auditor. All rights reserved.</span>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-slate-350 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-350 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-350 transition-colors">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default MainLayout;
