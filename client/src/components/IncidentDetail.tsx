import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Download, 
  Copy, 
  Plus, 
  Trash2, 
  ArrowRight, 
  GitBranch, 
  ShieldAlert, 
  Users, 
  DollarSign, 
  Activity,
  History,
  Check
} from 'lucide-react';
import { 
  FullIncident, 
  IncidentStatus, 
  TimelinePhase, 
  RootCauseCategory, 
  ActionPriority, 
  ActionStatus, 
  PreventativeCategory 
} from '../types';

interface IncidentDetailProps {
  incident: FullIncident;
  onClose: () => void;
  onUpdateStatus: (id: string, status: IncidentStatus) => Promise<void>;
  onAddTimeline: (incidentId: string, event: any) => Promise<void>;
  onDeleteTimeline: (incidentId: string, eventId: string) => Promise<void>;
  onAddRootCause: (incidentId: string, cause: any) => Promise<void>;
  onDeleteRootCause: (incidentId: string, causeId: string) => Promise<void>;
  onAddActionItem: (incidentId: string, item: any) => Promise<void>;
  onUpdateActionItem: (incidentId: string, itemId: string, update: any) => Promise<void>;
  onDeleteActionItem: (incidentId: string, itemId: string) => Promise<void>;
  onDeleteIncident: (id: string) => Promise<void>;
}

export const IncidentDetail: React.FC<IncidentDetailProps> = ({
  incident,
  onClose,
  onUpdateStatus,
  onAddTimeline,
  onDeleteTimeline,
  onAddRootCause,
  onDeleteRootCause,
  onAddActionItem,
  onUpdateActionItem,
  onDeleteActionItem,
  onDeleteIncident,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'root-cause' | 'actions' | 'audit' | 'export'>('timeline');
  const [copied, setCopied] = useState(false);

  // New timeline event form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventPhase, setEventPhase] = useState<TimelinePhase>('DIAGNOSIS');
  const [eventDesc, setEventDesc] = useState('');
  const [eventAuthor, setEventAuthor] = useState(incident.incidentCommander);
  const [eventSource, setEventSource] = useState('Investigation');

  // New 5-Whys form state
  const [showWhyForm, setShowWhyForm] = useState(false);
  const [whyLevel, setWhyLevel] = useState(incident.rootCauses.length + 1);
  const [whyQuestion, setWhyQuestion] = useState('');
  const [whyAnswer, setWhyAnswer] = useState('');
  const [whyCategory, setWhyCategory] = useState<RootCauseCategory>('INFRASTRUCTURE');
  const [whyTerminal, setWhyTerminal] = useState(false);

  // New Action Item form state
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [actionOwner, setActionOwner] = useState(incident.incidentCommander);
  const [actionPriority, setActionPriority] = useState<ActionPriority>('P1_HIGH');
  const [actionDueDate, setActionDueDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10));
  const [actionCategory, setActionCategory] = useState<PreventativeCategory>('ARCHITECTURAL_RESILIENCE');

  const statuses: IncidentStatus[] = ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED', 'CLOSED'];
  const metrics = incident.calculatedMetrics;

  const handleCopyMarkdown = () => {
    // Fetch or construct markdown export
    fetch(`/api/analytics/export/${incident.id}/markdown`)
      .then((res) => res.text())
      .then((md) => {
        navigator.clipboard.writeText(md);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  const handleDownloadMarkdown = () => {
    window.open(`/api/analytics/export/${incident.id}/markdown`, '_blank');
  };

  const submitTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDesc.trim()) return;
    await onAddTimeline(incident.id, {
      phase: eventPhase,
      description: eventDesc,
      author: eventAuthor,
      systemSource: eventSource,
      timestamp: new Date().toISOString(),
    });
    setEventDesc('');
    setShowEventForm(false);
  };

  const submitRootCause = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whyQuestion.trim() || !whyAnswer.trim()) return;
    await onAddRootCause(incident.id, {
      whyLevel,
      question: whyQuestion,
      answer: whyAnswer,
      category: whyCategory,
      isTerminalRootCause: whyTerminal ? 1 : 0,
    });
    setWhyQuestion('');
    setWhyAnswer('');
    setWhyTerminal(false);
    setShowWhyForm(false);
  };

  const submitActionItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim() || !actionOwner.trim()) return;
    await onAddActionItem(incident.id, {
      title: actionTitle,
      description: actionDesc,
      owner: actionOwner,
      priority: actionPriority,
      dueDate: actionDueDate,
      preventativeCategory: actionCategory,
    });
    setActionTitle('');
    setActionDesc('');
    setShowActionForm(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      
      {/* Incident Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-400">{incident.id}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                {incident.severity.replace('_', ' ')} (Score: {incident.severityScore}/100)
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                {incident.service} ({incident.serviceTier})
              </span>
              <span className="text-xs text-slate-400">
                Commander: <strong className="text-slate-200">{incident.incidentCommander}</strong>
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{incident.title}</h2>
            <p className="text-xs text-slate-400 max-w-3xl">{incident.summary}</p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${incident.id}?`)) {
                  onDeleteIncident(incident.id);
                }
              }}
              className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800 transition"
              title="Delete Incident"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              title="Close Workbench"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Lifecycle Status Progress Tracker */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            <span className="text-xs font-semibold uppercase text-slate-400 mr-2">Workflow Phase:</span>
            {statuses.map((st, idx) => {
              const currentIdx = statuses.indexOf(incident.status);
              const isCurrent = incident.status === st;
              const isPast = currentIdx > idx;

              let btnStyle = 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300';
              if (isCurrent) {
                btnStyle = 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-md';
              } else if (isPast) {
                btnStyle = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
              }

              return (
                <button
                  key={st}
                  onClick={() => onUpdateStatus(incident.id, st)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${btnStyle}`}
                >
                  {isPast && <Check className="w-3 h-3 text-emerald-400" />}
                  <span>{st}</span>
                </button>
              );
            })}
          </div>

          {/* SLA Badge */}
          {metrics && (
            <div className={`px-3 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
              metrics.isSlaBreached
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{metrics.isSlaBreached ? '⚠️ SLA BREACHED' : '✅ SLA COMPLIANT'}</span>
              <span className="text-slate-400">({metrics.totalDowntimeMinutes}m / {metrics.slaTargetMinutes}m target)</span>
            </div>
          )}
        </div>

      </div>

      {/* Metrics Banner */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4 bg-slate-950 border-b border-slate-800 text-xs">
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Total Outage</span>
            <span className="text-sm font-bold text-white">{metrics.totalDowntimeMinutes} min</span>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Time to Ack (MTTA)</span>
            <span className="text-sm font-bold text-sky-400">{metrics.timeToAcknowledgeMinutes} min</span>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Time to Mitigate</span>
            <span className="text-sm font-bold text-amber-400">{metrics.timeToMitigateMinutes} min</span>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Time to Resolve</span>
            <span className="text-sm font-bold text-emerald-400">{metrics.timeToResolveMinutes} min</span>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Financial Loss</span>
            <span className="text-sm font-bold text-rose-400">${incident.calculatedLoss.toLocaleString()}</span>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Users Impacted</span>
            <span className="text-sm font-bold text-slate-200">{incident.impactedUsersCount.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Post-Mortem Navigation Subtabs */}
      <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900 text-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 font-medium transition-colors border-b-2 px-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Timeline Forensics ({incident.timeline.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('root-cause')}
          className={`pb-3 font-medium transition-colors border-b-2 px-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'root-cause'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>5-Whys Root Cause Tree ({incident.rootCauses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`pb-3 font-medium transition-colors border-b-2 px-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'actions'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Preventative Actions ({incident.actionItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 font-medium transition-colors border-b-2 px-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log ({incident.auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`pb-3 font-medium transition-colors border-b-2 px-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'export'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Post-Mortem Publication</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-6">
        
        {/* TAB 1: TIMELINE FORENSICS */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Forensic Timeline Log</h3>
                <p className="text-xs text-slate-400">Chronological sequencing of telemetry, alerts, decisions, and remediations</p>
              </div>
              <button
                onClick={() => setShowEventForm(!showEventForm)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Timeline Event</span>
              </button>
            </div>

            {/* Inline Event Form */}
            {showEventForm && (
              <form onSubmit={submitTimelineEvent} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Phase</label>
                    <select
                      value={eventPhase}
                      onChange={(e) => setEventPhase(e.target.value as TimelinePhase)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="DETECTION">DETECTION</option>
                      <option value="DIAGNOSIS">DIAGNOSIS</option>
                      <option value="MITIGATION">MITIGATION</option>
                      <option value="RESOLUTION">RESOLUTION</option>
                      <option value="COMMUNICATION">COMMUNICATION</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Author / Engineer</label>
                    <input
                      type="text"
                      value={eventAuthor}
                      onChange={(e) => setEventAuthor(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">System Source</label>
                    <input
                      type="text"
                      value={eventSource}
                      onChange={(e) => setEventSource(e.target.value)}
                      placeholder="e.g. Prometheus, Datadog, Slack"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Event Description *</label>
                  <textarea
                    rows={2}
                    required
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="Document observation, telemetry spike, config change, or metric restoration..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
                  >
                    Add Event
                  </button>
                </div>
              </form>
            )}

            {/* Timeline Stream */}
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {incident.timeline.map((evt) => {
                const date = new Date(evt.timestamp);
                const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const dateString = date.toLocaleDateString();

                let phaseColor = 'bg-slate-500 text-white';
                if (evt.phase === 'DETECTION') phaseColor = 'bg-rose-500 text-white';
                if (evt.phase === 'DIAGNOSIS') phaseColor = 'bg-amber-500 text-white';
                if (evt.phase === 'MITIGATION') phaseColor = 'bg-sky-500 text-white';
                if (evt.phase === 'RESOLUTION') phaseColor = 'bg-emerald-500 text-white';

                return (
                  <div key={evt.id} className="relative group">
                    <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-indigo-500" />
                    
                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 transition-all group-hover:border-slate-700">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${phaseColor}`}>
                            {evt.phase}
                          </span>
                          <span className="font-mono text-xs text-slate-400">
                            {timeString} ({dateString})
                          </span>
                          {evt.systemSource && (
                            <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {evt.systemSource}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 italic">by {evt.author}</span>
                          <button
                            onClick={() => onDeleteTimeline(incident.id, evt.id)}
                            className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition p-1"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-200">{evt.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: 5-WHYS ROOT CAUSE ANALYSIS */}
        {activeTab === 'root-cause' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">5-Whys Causal Tree & Ishikawa Factors</h3>
                <p className="text-xs text-slate-400">Iterative interrogative technique to drill down to the fundamental systemic failure</p>
              </div>
              <button
                onClick={() => setShowWhyForm(!showWhyForm)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add / Update Why Level</span>
              </button>
            </div>

            {/* Inline 5-Whys Form */}
            {showWhyForm && (
              <form onSubmit={submitRootCause} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Why Level (1 to 5)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={whyLevel}
                      onChange={(e) => setWhyLevel(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Ishikawa Category</label>
                    <select
                      value={whyCategory}
                      onChange={(e) => setWhyCategory(e.target.value as RootCauseCategory)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="INFRASTRUCTURE">Infrastructure</option>
                      <option value="CODE_DEFECT">Code Defect / Bug</option>
                      <option value="CONFIGURATION">Configuration</option>
                      <option value="PROCESS">Process / Governance</option>
                      <option value="DEPENDENCY">Third-Party Dependency</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whyTerminal}
                        onChange={(e) => setWhyTerminal(e.target.checked)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>Is Terminal Root Cause?</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Question (Why did...?) *</label>
                  <input
                    type="text"
                    required
                    value={whyQuestion}
                    onChange={(e) => setWhyQuestion(e.target.value)}
                    placeholder="e.g. Why did the payment webhook return 504?"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Answer (Because...) *</label>
                  <textarea
                    rows={2}
                    required
                    value={whyAnswer}
                    onChange={(e) => setWhyAnswer(e.target.value)}
                    placeholder="e.g. Because TLS handshakes saturated the connection ticket cache."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowWhyForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
                  >
                    Save Why Level
                  </button>
                </div>
              </form>
            )}

            {/* 5-Whys Ladder */}
            <div className="space-y-3">
              {incident.rootCauses.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs">
                  No 5-Whys causal chain logged yet. Click "+ Add / Update Why Level" to begin the root-cause drilldown.
                </div>
              ) : (
                incident.rootCauses.map((rc, idx) => {
                  return (
                    <div
                      key={rc.id}
                      className={`relative bg-slate-950 border rounded-xl p-4 transition-all ${
                        rc.isTerminalRootCause === 1
                          ? 'border-rose-500/50 bg-rose-950/10'
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-indigo-400 font-bold border border-slate-800">
                            WHY #{rc.whyLevel}
                          </span>
                          <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {rc.category}
                          </span>
                          {rc.isTerminalRootCause === 1 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                              ★ TERMINAL ROOT CAUSE
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => onDeleteRootCause(incident.id, rc.id)}
                          className="text-slate-500 hover:text-rose-400 transition p-1"
                          title="Delete Step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-200">
                          Q: {rc.question}
                        </p>
                        <p className="text-xs text-slate-400 pl-4 border-l-2 border-indigo-500/50">
                          <strong>A:</strong> {rc.answer}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PREVENTATIVE ACTIONS */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Preventative Engineering Safeguards</h3>
                <p className="text-xs text-slate-400">Track corrective architectural changes, alert tuning, and runbook updates</p>
              </div>
              <button
                onClick={() => setShowActionForm(!showActionForm)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Action Item</span>
              </button>
            </div>

            {/* Inline Action Item Form */}
            {showActionForm && (
              <form onSubmit={submitActionItem} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Priority</label>
                    <select
                      value={actionPriority}
                      onChange={(e) => setActionPriority(e.target.value as ActionPriority)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="P0_BLOCKER">P0 - Blocker</option>
                      <option value="P1_HIGH">P1 - High</option>
                      <option value="P2_MEDIUM">P2 - Medium</option>
                      <option value="P3_LOW">P3 - Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Owner / Assignee *</label>
                    <input
                      type="text"
                      required
                      value={actionOwner}
                      onChange={(e) => setActionOwner(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Target Due Date</label>
                    <input
                      type="date"
                      value={actionDueDate}
                      onChange={(e) => setActionDueDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Preventative Category</label>
                    <select
                      value={actionCategory}
                      onChange={(e) => setActionCategory(e.target.value as PreventativeCategory)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="ARCHITECTURAL_RESILIENCE">Architectural Resilience</option>
                      <option value="MONITORING_ALERTING">Monitoring & Alerting</option>
                      <option value="AUTOMATION">Automation & CI/CD Gate</option>
                      <option value="RUNBOOK_PROCESS">Runbook & Governance</option>
                      <option value="CHAOS_TESTING">Chaos / Soak Testing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={actionTitle}
                      onChange={(e) => setActionTitle(e.target.value)}
                      placeholder="e.g. Add circuit breaker to downstream billing client"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Implementation Description</label>
                  <textarea
                    rows={2}
                    value={actionDesc}
                    onChange={(e) => setActionDesc(e.target.value)}
                    placeholder="Specific engineering steps, PR link, or configuration parameter..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowActionForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
                  >
                    Create Action Item
                  </button>
                </div>
              </form>
            )}

            {/* Action Items List */}
            <div className="space-y-3">
              {incident.actionItems.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs">
                  No action items created yet. Click "+ New Action Item" to assign preventative engineering safeguards.
                </div>
              ) : (
                incident.actionItems.map((act) => {
                  let prioColor = 'bg-slate-800 text-slate-300';
                  if (act.priority === 'P0_BLOCKER') prioColor = 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold';
                  if (act.priority === 'P1_HIGH') prioColor = 'bg-amber-500/20 text-amber-400 border border-amber-500/40';

                  return (
                    <div
                      key={act.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${prioColor}`}>
                            {act.priority.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-semibold text-white">{act.title}</span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {act.preventativeCategory}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Status dropdown */}
                          <select
                            value={act.status}
                            onChange={(e) => onUpdateActionItem(incident.id, act.id, { status: e.target.value })}
                            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded px-2 py-1 font-medium focus:outline-none"
                          >
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="VERIFIED">VERIFIED (CLOSED-LOOP)</option>
                          </select>

                          <button
                            onClick={() => onDeleteActionItem(incident.id, act.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Delete Action Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {act.description && (
                        <p className="text-xs text-slate-400">{act.description}</p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                        <span>Owner: <strong className="text-slate-300">{act.owner}</strong></span>
                        <span>Due: <strong className="text-slate-300">{act.dueDate}</strong></span>
                      </div>

                      {/* Verification Notes */}
                      {act.status === 'VERIFIED' && act.verificationNotes && (
                        <div className="p-2 rounded bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300">
                          <strong>Verification Audit:</strong> {act.verificationNotes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white mb-2">Immutable Audit Log</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-850">
              {incident.auditLogs.map((log) => (
                <div key={log.id} className="p-3 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-400 font-bold">{log.action}</span>
                      <span className="text-slate-400">by {log.actor}</span>
                    </div>
                    <p className="text-slate-300">{log.details}</p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(Number(log.timestamp) || log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: POST-MORTEM EXPORT */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Post-Mortem Publication Ready</h3>
                <p className="text-xs text-slate-400">Compiled report ready for engineering all-hands or executive stakeholders</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
                </button>

                <button
                  onClick={handleDownloadMarkdown}
                  className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md Report</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-xs font-mono text-slate-300 overflow-x-auto max-h-[480px]">
              <div className="space-y-3">
                <p className="text-indigo-400 font-bold"># Incident Post-Mortem: {incident.title} ({incident.id})</p>
                <p className="text-slate-400">&gt; Status: {incident.status} | Severity: {incident.severity} | Service: {incident.service} ({incident.serviceTier})</p>
                <p className="text-slate-400">&gt; Incident Commander: {incident.incidentCommander}</p>
                
                <p className="text-white font-bold pt-2">## 1. Executive Summary</p>
                <p>{incident.summary}</p>

                <p className="text-white font-bold pt-2">## 2. Impact & Reliability Metrics</p>
                <p>- Impacted Users: {incident.impactedUsersCount.toLocaleString()}</p>
                <p>- Outage Duration: {metrics?.totalDowntimeMinutes || 0} minutes</p>
                <p>- Calculated Financial Downtime Loss: ${incident.calculatedLoss.toLocaleString()}</p>
                <p>- SLA Status: {metrics?.isSlaBreached ? 'SLA BREACHED' : 'SLA COMPLIANT'}</p>

                <p className="text-white font-bold pt-2">## 3. 5-Whys Root Cause Chain</p>
                {incident.rootCauses.map((rc) => (
                  <p key={rc.id}>
                    Why #{rc.whyLevel} [{rc.category}]: {rc.question} -&gt; {rc.answer}
                  </p>
                ))}

                <p className="text-white font-bold pt-2">## 4. Preventative Actions</p>
                {incident.actionItems.map((act) => (
                  <p key={act.id}>
                    - [{act.priority}] {act.title} (Owner: {act.owner}, Status: {act.status})
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
