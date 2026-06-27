import React from 'react';

interface SkeletonLoadingProps {
  type?: 'dashboard' | 'issues' | 'journey';
}

export const SkeletonLoading: React.FC<SkeletonLoadingProps> = ({ type = 'dashboard' }) => {
  const CardSkeleton = () => (
    <div className="bg-card border border-slate-800 rounded-xl p-6 animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-800 rounded w-1/3"></div>
        <div className="h-8 bg-slate-800 w-8 rounded-full"></div>
      </div>
      <div className="h-8 bg-slate-800 rounded w-1/2"></div>
      <div className="h-3 bg-slate-800 rounded w-3/4"></div>
    </div>
  );

  if (type === 'issues') {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-card border border-slate-800 rounded-xl p-6 animate-pulse space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2 w-2/3">
                <div className="h-5 bg-slate-800 rounded w-3/4"></div>
                <div className="h-4 bg-slate-800 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-slate-800 rounded w-20"></div>
            </div>
            <div className="h-16 bg-slate-900 rounded border border-slate-800 w-full"></div>
            <div className="flex space-x-3">
              <div className="h-8 bg-slate-800 rounded w-24"></div>
              <div className="h-8 bg-slate-800 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'journey') {
    return (
      <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 md:space-x-4 p-8 bg-card border border-slate-800 rounded-2xl animate-pulse">
        {[1, 2, 3, 4].map((n) => (
          <React.Fragment key={n}>
            <div className="w-full md:w-48 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="h-4 bg-slate-800 rounded w-1/2"></div>
              <div className="h-6 bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-800 rounded w-2/3"></div>
            </div>
            {n < 4 && (
              <div className="hidden md:block w-8 h-1 bg-slate-800"></div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 Metrics cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Main double column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-slate-800 rounded-xl p-6 h-80 animate-pulse space-y-4">
          <div className="h-4 bg-slate-800 rounded w-1/4"></div>
          <div className="w-full h-56 bg-slate-900 rounded"></div>
        </div>
        <div className="bg-card border border-slate-800 rounded-xl p-6 h-80 animate-pulse space-y-4">
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          <div className="w-full h-56 bg-slate-900 rounded-full mx-auto max-w-[200px]"></div>
        </div>
      </div>
    </div>
  );
};
