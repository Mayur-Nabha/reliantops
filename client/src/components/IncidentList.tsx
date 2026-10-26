import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Flame, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Users, 
  DollarSign, 
  ChevronRight,
  TrendingUp,
  Server
} from 'lucide-react';
import { Incident, IncidentSeverity, IncidentStatus } from '../types';

interface IncidentListProps {
  incidents: Incident[];
  selectedId: string | null;
  onSelectIncident: (id: string) => void;
  loading: boolean;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  selectedId,
  onSelectIncident,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Filtered list
  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Severity styling helper
  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'P1_CRITICAL':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'P2_HIGH':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'P3_MEDIUM':
        return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
      case 'P4_LOW':
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  // Status badge helper
  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'INVESTIGATING':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'IDENTIFIED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'MONITORING':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CLOSED':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search title, ID, service..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Severities</option>
            <option value="P1_CRITICAL">P1 - Critical</option>
            <option value="P2_HIGH">P2 - High</option>
            <option value="P3_MEDIUM">P3 - Medium</option>
            <option value="P4_LOW">P4 - Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="IDENTIFIED">Identified</option>
            <option value="MONITORING">Monitoring</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

      </div>

      {/* Incident Cards Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="inline-flex p-3 bg-slate-800 rounded-xl text-slate-400 mb-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-base font-medium text-white mb-1">No Incidents Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            No incidents match your current search and filter criteria. You can clear filters or declare a new incident.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inc) => {
            const isSelected = selectedId === inc.id;
            const detectedTime = new Date(inc.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc.id)}
                className={`group cursor-pointer bg-slate-900 border rounded-xl p-4 sm:p-5 transition-all duration-150 hover:border-indigo-500/50 hover:bg-slate-900/90 shadow-sm ${
                  isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-slate-850' : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left Column: ID, Severity, Title, Service */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-slate-400">{inc.id}</span>
                      
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity.replace('_', ' ')}
                      </span>

                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusBadge(inc.status)}`}>
                        {inc.status}
                      </span>

                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono flex items-center gap-1 border border-slate-700/50">
                        <Server className="w-3 h-3 text-slate-400" />
                        {inc.service} ({inc.serviceTier})
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {inc.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-1">
                      {inc.summary}
                    </p>
                  </div>

                  {/* Right Column: Metrics & Time */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="flex items-center gap-3 text-xs">
                      
                      {inc.impactedUsersCount > 0 && (
                        <div className="flex items-center gap-1 text-slate-300" title="Impacted Users">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{inc.impactedUsersCount.toLocaleString()}</span>
                        </div>
                      )}

                      {inc.calculatedLoss > 0 && (
                        <div className="flex items-center gap-1 text-amber-400 font-medium" title="Calculated Loss">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>${inc.calculatedLoss.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-slate-400" title="Detected Time">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{detectedTime}</span>
                      </div>
                    </div>

                    <div className="text-slate-500 group-hover:text-indigo-400 transition-colors pl-2">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
