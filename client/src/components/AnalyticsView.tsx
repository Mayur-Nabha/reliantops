import React from 'react';
import { 
  Activity, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Server,
  TrendingDown,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { ReliabilityOverview } from '../types';

interface AnalyticsViewProps {
  overview: ReliabilityOverview | null;
  loading: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ overview, loading }) => {
  if (loading || !overview) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-36 animate-pulse" />
        ))}
      </div>
    );
  }

  const {
    totalIncidents,
    activeIncidents,
    resolvedIncidents,
    slaBreachCount,
    slaCompliancePercentage,
    meanTimeToAcknowledgeMinutes,
    meanTimeToMitigateMinutes,
    meanTimeToResolveMinutes,
    totalCalculatedFinancialLoss,
    reliabilityHealthScore,
    incidentsBySeverity,
    serviceHealth,
  } = overview;

  return (
    <div className="space-y-6">
      
      {/* Top Level SRE KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Reliability Health Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium uppercase tracking-wider">Reliability Health Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{reliabilityHealthScore}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {reliabilityHealthScore >= 80 ? 'Optimal platform stability across all tiers.' : 'Active P1s or SLA breaches reducing reliability.'}
          </p>
        </div>

        {/* KPI 2: Mean Time to Resolve (MTTR) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium uppercase tracking-wider">MTTR (Mean Time to Resolve)</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{meanTimeToResolveMinutes}</span>
            <span className="text-xs text-slate-400">minutes</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            MTTA: <strong className="text-slate-300">{meanTimeToAcknowledgeMinutes}m</strong> | MTTM: <strong className="text-slate-300">{meanTimeToMitigateMinutes}m</strong>
          </p>
        </div>

        {/* KPI 3: SLA Compliance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium uppercase tracking-wider">SLA Compliance Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">{slaCompliancePercentage}%</span>
            <span className="text-xs text-slate-400">target &gt; 99%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {slaBreachCount} SLA breach events out of {totalIncidents} incidents
          </p>
        </div>

        {/* KPI 4: Financial Loss Exposure */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium uppercase tracking-wider">Total Outage Loss</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
              ${totalCalculatedFinancialLoss.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Derived from downtime duration &times; revenue burn rate
          </p>
        </div>

      </div>

      {/* Breakdown Row: Severity Distribution & Lifecycle Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Severity Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Incident Distribution by Severity</h3>
            <span className="text-xs text-slate-400 font-mono">Total: {totalIncidents}</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'P1 - Critical', count: incidentsBySeverity.P1_CRITICAL, color: 'bg-rose-500', text: 'text-rose-400' },
              { label: 'P2 - High', count: incidentsBySeverity.P2_HIGH, color: 'bg-amber-500', text: 'text-amber-400' },
              { label: 'P3 - Medium', count: incidentsBySeverity.P3_MEDIUM, color: 'bg-yellow-500', text: 'text-yellow-400' },
              { label: 'P4 - Low', count: incidentsBySeverity.P4_LOW, color: 'bg-blue-500', text: 'text-blue-400' },
            ].map((sev) => {
              const pct = totalIncidents > 0 ? Math.round((sev.count / totalIncidents) * 100) : 0;
              return (
                <div key={sev.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{sev.label}</span>
                    <span className={`font-mono font-bold ${sev.text}`}>{sev.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${sev.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Lifecycle Status Ratio */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Incident Lifecycle State</h3>
            <span className="text-xs text-slate-400 font-mono">Active: {activeIncidents} / Resolved: {resolvedIncidents}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Active Outages</span>
              <span className="text-2xl font-extrabold text-rose-400">{activeIncidents}</span>
              <span className="text-[11px] text-slate-500 block mt-1">In triage or monitoring</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Resolved Outages</span>
              <span className="text-2xl font-extrabold text-emerald-400">{resolvedIncidents}</span>
              <span className="text-[11px] text-slate-500 block mt-1">Post-mortem ready</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/40 text-xs text-indigo-300">
            <strong>SRE Rule:</strong> Any P1 outage requires a published 5-Whys root cause analysis and verified preventative engineering action items within 48 hours of resolution.
          </div>
        </div>

      </div>

      {/* Service Health & Reliability Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Microservice Reliability Matrix</h3>
            <p className="text-xs text-slate-400">Cumulative incident frequency, downtime, and SLA breach rate per service</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Service Name</th>
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3">Incidents</th>
                <th className="py-2.5 px-3">Total Downtime</th>
                <th className="py-2.5 px-3">SLA Breach %</th>
                <th className="py-2.5 px-3">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {serviceHealth.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">
                    No service reliability telemetry recorded yet.
                  </td>
                </tr>
              ) : (
                serviceHealth.map((srv) => {
                  let statusBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                  if (srv.status === 'CRITICAL') statusBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                  if (srv.status === 'DEGRADED') statusBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/30';

                  return (
                    <tr key={srv.service} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 px-3 font-medium text-white flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-slate-400" />
                        <span>{srv.service}</span>
                      </td>
                      <td className="py-3 px-3 font-mono">{srv.tier}</td>
                      <td className="py-3 px-3 font-mono font-bold text-white">{srv.incidentCount}</td>
                      <td className="py-3 px-3 font-mono">{srv.totalDowntimeMinutes} min</td>
                      <td className="py-3 px-3 font-mono">{srv.slaBreachRate}%</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge}`}>
                          {srv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
