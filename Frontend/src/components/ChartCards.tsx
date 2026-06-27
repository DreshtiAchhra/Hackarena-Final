import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';
import { mockChartData } from '../mock/auditData';

// Custom Tooltip component for cohesive look
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl text-xs space-y-1">
        {label && <p className="font-bold text-slate-200">{label}</p>}
        {payload.map((item: any, index: number) => (
          <p key={index} style={{ color: item.color || item.fill }} className="font-semibold">
            {item.name}: {item.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 1. Severity Distribution (Pie Chart)
export const SeverityDistributionChart: React.FC = () => {
  const data = mockChartData.severityDistribution;
  return (
    <div className="bg-card border border-slate-800 rounded-xl p-5 h-80 flex flex-col justify-between">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-slate-300">Severity Distribution</h4>
        <span className="text-[10px] text-slate-500 font-mono">Total Issues: 61</span>
      </div>
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="48%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 2. Issue Categories (Horizontal Bar Chart)
export const CategoryDistributionChart: React.FC = () => {
  const data = mockChartData.categoryDistribution;
  return (
    <div className="bg-card border border-slate-800 rounded-xl p-5 h-80 flex flex-col justify-between">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-slate-300">Violations by Category</h4>
        <span className="text-[10px] text-slate-500 font-mono">Top Categories</span>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
            <XAxis type="number" stroke="#64748B" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis 
              dataKey="category" 
              type="category" 
              stroke="#64748B" 
              fontSize={10} 
              axisLine={false} 
              tickLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#4F46E5" radius={[0, 4, 4, 0]} name="Issues Found">
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#EF4444' : index === 1 ? '#F59E0B' : '#4F46E5'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 3. Pages Audited (Composite Line and Bar Chart)
export const PagesAuditedChart: React.FC = () => {
  const data = mockChartData.pagesAudited;
  return (
    <div className="bg-card border border-slate-800 rounded-xl p-5 h-80 flex flex-col justify-between">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-slate-300">UX Scores vs Issues Count</h4>
        <span className="text-[10px] text-slate-500 font-mono">Page Level Telemetry</span>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="page" stroke="#64748B" fontSize={9} axisLine={false} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#22C55E" 
              strokeWidth={3}
              name="UX/Lighthouse Score" 
              activeDot={{ r: 6 }} 
            />
            <Line 
              type="monotone" 
              dataKey="issues" 
              stroke="#EF4444" 
              strokeWidth={2}
              strokeDasharray="4 4"
              name="Issues Detected" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 4. Journey Completion Dropoff (Gradient Area Chart)
export const JourneyCompletionChart: React.FC = () => {
  const data = mockChartData.journeyCompletion;
  return (
    <div className="bg-card border border-slate-800 rounded-xl p-5 h-80 flex flex-col justify-between">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-slate-300">User Journey Dropoff Funnel</h4>
        <span className="text-[10px] text-slate-500 font-mono">Estimated Retention %</span>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorDropoff" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="stage" stroke="#64748B" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={10} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="users" 
              stroke="#4F46E5" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorDropoff)" 
              name="Simulated Users" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
