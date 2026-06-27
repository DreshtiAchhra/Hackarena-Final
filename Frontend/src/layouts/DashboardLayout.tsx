import React from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Body Grid */}
      <div className="flex flex-1 items-stretch">
        {/* Sidebar */}
        <Sidebar />

        {/* Dynamic content viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background relative">
          {/* Subtle background glow mesh */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/3 rounded-full blur-3xl pointer-events-none"></div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="h-full relative z-10"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
