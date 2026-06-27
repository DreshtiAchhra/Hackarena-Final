import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { motion } from 'framer-motion';
import { 
  Globe, 
  ArrowRight, 
  Accessibility, 
  Compass, 
  Brain, 
  Sparkles, 
  FileCheck, 
  ShieldAlert 
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please provide a valid website domain.');
      return;
    }
    
    try {
      const targetUrl = url.startsWith('http') ? url : `https://${url}`;
      new URL(targetUrl);
      setError('');
      navigate(`/progress?url=${encodeURIComponent(targetUrl)}`);
    } catch (err) {
      setError('Invalid format. Please enter a valid URL (e.g. shoppycart.io)');
    }
  };

  const features = [
    {
      title: "Accessibility Analysis",
      desc: "Scans DOM elements against WCAG 2.1 AA and AAA standards to resolve contrast ratios, aria tags, and font sizes.",
      icon: <Accessibility className="w-6 h-6 text-accent" />,
      tag: "WCAG Compliance"
    },
    {
      title: "UX Heuristic Auditing",
      desc: "Applies Jakob Nielsen's 10 usability heuristics using specialized AI reasoning to verify controls and interactions.",
      icon: <Compass className="w-6 h-6 text-emerald-600" />,
      tag: "Usability"
    },
    {
      title: "Journey Analysis",
      desc: "Simulates user checkout and browse funnels dynamically to track visual drop-offs and interaction obstacles.",
      icon: <Brain className="w-6 h-6 text-purple-650" />,
      tag: "Funnel Mapping"
    },
    {
      title: "Conversational Assistant",
      desc: "Consult our real-time audit copilot to generate code-level fixes, explain scores, and prioritize engineering work.",
      icon: <Sparkles className="w-6 h-6 text-amber-600" />,
      tag: "AI Copilot"
    },
    {
      title: "Recommendation Engine",
      desc: "Generates production-ready React, Tailwind, and HTML layout patches to fix accessibility problems instantly.",
      icon: <FileCheck className="w-6 h-6 text-red-650" />,
      tag: "Autofix Patches"
    }
  ];

  return (
    <MainLayout>
      <div className="py-8 md:py-16 space-y-20 flex flex-col items-center">
        
        {/* Centered Hero Area */}
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-6">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-accent"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Next-Gen Conversational Auditing</span>
          </motion.div>

          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-slate-900"
          >
            Conversational <br />
            <span className="bg-gradient-to-r from-accent via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              UX Auditor
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed"
          >
            AI-powered website auditing for accessibility, usability, and user experience. 
            Trace user journeys, isolate critical violations, and consult our assistant for instant code fixes.
          </motion.p>

          {/* Centered Input Form */}
          <motion.form 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleAnalyze}
            className="space-y-3 w-full max-w-xl mx-auto px-4"
          >
            <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white border border-slate-200 rounded-xl focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all duration-250 shadow-glass">
              <div className="flex items-center space-x-2.5 px-3 flex-1">
                <Globe className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter website URL (e.g. shoppycart.io)"
                  className="w-full bg-transparent border-0 outline-none focus:ring-0 text-slate-800 text-sm placeholder-slate-400 py-2.5"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-accent hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center space-x-1.5 shadow-md shadow-accent-glow shrink-0"
              >
                <span>Analyze Website</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="flex items-center justify-center space-x-1.5 text-xs text-danger">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}
          </motion.form>

          {/* Popular shortcuts */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center space-x-4 text-xs text-slate-600 font-mono"
          >
            <span>Popular:</span>
            <button onClick={() => setUrl('shoppycart.io')} type="button" className="text-indigo-900 font-semibold hover:text-accent transition-colors underline cursor-pointer">shoppycart.io</button>
            <span>•</span>
            <button onClick={() => setUrl('blog.travelworld.net')} type="button" className="text-indigo-900 font-semibold hover:text-accent transition-colors underline cursor-pointer">travelworld.net</button>
          </motion.div>
        </div>

        {/* Centered Architecture Graphic */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="flex justify-center items-center relative w-full max-w-[400px] h-[320px] mx-auto"
        >
          <div className="absolute w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          
          <svg 
            className="w-full h-full select-none" 
            viewBox="0 0 400 400" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Spinning outer grid circle */}
            <circle cx="200" cy="200" r="160" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="6 8" className="animate-spin" style={{ animationDuration: '60s' }} />
            
            {/* Spinning inner scanner ring */}
            <circle cx="200" cy="200" r="120" stroke="#2563EB" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="20 40" className="animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />

            {/* Central Core */}
            <g className="animate-float">
              <circle cx="200" cy="200" r="45" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" className="shadow-accent-glow" />
              <path d="M190 190H210V210H190V190Z" fill="url(#coreGrad)" />
              <circle cx="200" cy="200" r="8" fill="#2563EB" className="animate-pulse" />
            </g>

            {/* Pipeline Nodes */}
            <g className="transition-all hover:scale-105 duration-200">
              <circle cx="200" cy="60" r="22" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <circle cx="200" cy="60" r="6" fill="#10B981" />
              <text x="200" y="94" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle">DISCOVER</text>
            </g>

            <g className="transition-all hover:scale-105 duration-200">
              <circle cx="320" cy="140" r="22" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <circle cx="320" cy="140" r="6" fill="#2563EB" />
              <text x="320" y="174" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle">AGENT</text>
            </g>

            <g className="transition-all hover:scale-105 duration-200">
              <circle cx="320" cy="260" r="22" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <circle cx="320" cy="260" r="6" fill="#F59E0B" />
              <text x="320" y="294" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle">METRICS</text>
            </g>

            <g className="transition-all hover:scale-105 duration-200">
              <circle cx="200" cy="340" r="22" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <circle cx="200" cy="340" r="6" fill="#8B5CF6" />
              <text x="200" y="374" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle">KNOWLEDGE</text>
            </g>

            <g className="transition-all hover:scale-105 duration-200">
              <circle cx="80" cy="260" r="22" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <circle cx="80" cy="260" r="6" fill="#EC4899" />
              <text x="80" y="294" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle">HEURISTICS</text>
            </g>

            <g className="transition-all hover:scale-105 duration-200">
              <circle cx="80" cy="140" r="22" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <circle cx="80" cy="140" r="6" fill="#10B981" />
              <text x="80" y="174" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle">REPORT</text>
            </g>

            {/* Connecting lines */}
            <path d="M200 82V155" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M298 155L240 185" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M298 245L240 215" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M200 318V245" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M102 245L160 215" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M102 155L160 185" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />

            <defs>
              <linearGradient id="coreGrad" x1="190" y1="190" x2="210" y2="210" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563EB" />
                <stop offset="1" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Features Grid Section */}
        <div className="space-y-10 w-full">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Continuous UX & Accessibility Auditing</h2>
            <p className="text-slate-650 text-sm md:text-base max-w-2xl mx-auto">
              Our autonomous scanner processes components across standard usage pathways to expose violations before deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div 
                key={feat.title}
                className="p-6 bg-white border border-slate-200 rounded-xl hover:border-slate-350 hover:bg-slate-50/50 transition-all duration-300 relative group overflow-hidden shadow-sm"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-accent/20 group-hover:bg-accent transition-colors duration-300"></div>
                <div className="mb-4 bg-slate-50 border border-slate-100 p-2.5 rounded-lg w-fit text-accent">
                  {feat.icon}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-slate-800">{feat.title}</h3>
                    <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase font-bold">{feat.tag}</span>
                  </div>
                  <p className="text-xs text-slate-650 leading-relaxed font-normal">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </MainLayout>
  );
};
export default LandingPage;
