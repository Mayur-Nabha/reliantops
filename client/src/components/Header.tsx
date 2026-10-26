import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  PlusCircle, 
  Database, 
  RotateCcw, 
  BarChart3, 
  LayoutList 
} from 'lucide-react';
import { ReliabilityOverview } from '../types';

interface HeaderProps {
  currentTab: 'incidents' | 'analytics';
  onTabChange: (tab: 'incidents' | 'analytics') => void;
  onOpenCreateModal: () => void;
  onSeedData: () => void;
  onResetData: () => void;
  overview?: ReliabilityOverview | null;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenCreateModal,
  onSeedData,
  onResetData,
  overview,
  loading,
}) => {
  const healthScore = overview?.reliabilityHealthScore ?? 100;
  let healthBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (healthScore < 60) {
    healthBadgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (healthScore < 80) {
    healthBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Live Status */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30 shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">ReliantOps</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-medium">
                  SRE Platform
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Incident Response & Post-Mortem Intelligence Engine</p>
            </div>
          </div>

          {/* Reliability Score Pill */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${healthBadgeColor}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
            <span>Health Score: <strong>{healthScore}%</strong></span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-sm">
          <button
            onClick={() => onTabChange('incidents')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-medium transition-all ${
              currentTab === 'incidents'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            <span>Incidents & Command</span>
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-medium transition-all ${
              currentTab === 'analytics'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reliability Analytics</span>
          </button>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={onSeedData}
            title="Load 3 realistic production incident scenarios with full timelines and 5-whys"
            className="flex items-center gap-1.5 text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition font-medium"
            disabled={loading}
          >
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Load Demo Scenarios</span>
            <span className="sm:hidden">Seed</span>
          </button>

          <button
            onClick={onResetData}
            title="Reset all database tables to empty state"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 transition"
            disabled={loading}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 text-xs sm:text-sm px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md hover:shadow-indigo-500/20 transition font-medium"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Declare Incident</span>
          </button>
        </div>

      </div>
    </header>
  );
};
