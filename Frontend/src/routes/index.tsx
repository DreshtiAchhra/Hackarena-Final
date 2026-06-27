import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import ProgressPage from '../pages/ProgressPage';
import Dashboard from '../pages/Dashboard';
import JourneyView from '../pages/JourneyView';
import Assistant from '../pages/Assistant';
import ReportPage from '../pages/ReportPage';
import HistoryPage from '../pages/HistoryPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/progress" element={<ProgressPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/journey" element={<JourneyView />} />
      <Route path="/assistant" element={<Assistant />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/history" element={<HistoryPage />} />
      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default AppRoutes;
