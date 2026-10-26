import React, { useState, useMemo } from 'react';
import { X, AlertTriangle, ShieldCheck, DollarSign, Users, Layers, Flame } from 'lucide-react';
import { Criticality, DataLossRisk, ServiceTier } from '../types';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
}) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [service, setService] = useState('Payment Gateway');
  const [serviceTier, setServiceTier] = useState<ServiceTier>('TIER_0');
  const [incidentCommander, setIncidentCommander] = useState('SRE On-Call Lead');
  const [impactedUsersCount, setImpactedUsersCount] = useState<number>(5000);
  const [businessCriticality, setBusinessCriticality] = useState<Criticality>('HIGH');
  const [financialLossPerHour, setFinancialLossPerHour] = useState<number>(25000);
  const [dataLossRisk, setDataLossRisk] = useState<DataLossRisk>('NONE');

  // Live client-side calculation preview based on same formula as backend
  const previewCalculation = useMemo(() => {
    let score = 0;
    const rationale: string[] = [];

    // Tier
    if (serviceTier === 'TIER_0') { score += 35; rationale.push('Tier 0 mission-critical (+35)'); }
    else if (serviceTier === 'TIER_1') { score += 25; rationale.push('Tier 1 revenue service (+25)'); }
    else if (serviceTier === 'TIER_2') { score += 15; rationale.push('Tier 2 internal service (+15)'); }
    else { score += 5; rationale.push('Tier 3 utility service (+5)'); }

    // Blast radius
    if (impactedUsersCount >= 50000) { score += 25; rationale.push('Blast radius > 50k users (+25)'); }
    else if (impactedUsersCount >= 10000) { score += 18; rationale.push('Blast radius > 10k users (+18)'); }
    else if (impactedUsersCount >= 1000) { score += 12; rationale.push('Blast radius > 1k users (+12)'); }
    else if (impactedUsersCount >= 100) { score += 6; rationale.push('Blast radius > 100 users (+6)'); }
    else { score += 2; rationale.push('Low user impact (+2)'); }

    // Data Loss Risk
    if (dataLossRisk === 'CONFIRMED') { score += 25; rationale.push('Confirmed data corruption risk (+25)'); }
    else if (dataLossRisk === 'POSSIBLE') { score += 15; rationale.push('Potential data consistency risk (+15)'); }

    // Financial burn
    if (financialLossPerHour >= 50000) { score += 15; rationale.push('High burn > $50k/hr (+15)'); }
    else if (financialLossPerHour >= 10000) { score += 10; rationale.push('Moderate burn > $10k/hr (+10)'); }
    else if (financialLossPerHour > 0) { score += 5; rationale.push('Low financial burn (+5)'); }

    score = Math.min(100, Math.round(score));
    let severity = 'P4_LOW';
    let slaAck = '120 min';
    let slaResolve = '24 hours';
    let badgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';

    if (score >= 75) {
      severity = 'P1_CRITICAL';
      slaAck = '15 min';
      slaResolve = '60 min';
      badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    } else if (score >= 50) {
      severity = 'P2_HIGH';
      slaAck = '30 min';
      slaResolve = '4 hours';
      badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    } else if (score >= 25) {
      severity = 'P3_MEDIUM';
      slaAck = '60 min';
      slaResolve = '12 hours';
      badgeColor = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    }

    return { score, severity, slaAck, slaResolve, badgeColor, rationale };
  }, [serviceTier, impactedUsersCount, dataLossRisk, financialLossPerHour]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onSubmit({
      title,
      summary,
      service,
      serviceTier,
      incidentCommander,
      impactedUsersCount,
      businessCriticality,
      financialLossPerHour,
      dataLossRisk,
      detectedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Declare SRE Incident</h2>
              <p className="text-xs text-slate-400">Initiates incident triage, severity matrix scoring, and SLA timer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Incident Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ingress Gateway TLS Handshake Timeout Spikes"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Service & Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Target Service / Component *
              </label>
              <input
                type="text"
                required
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g. Payment Gateway, Auth API, Redis Cluster"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Service Architecture Tier
              </label>
              <select
                value={serviceTier}
                onChange={(e) => setServiceTier(e.target.value as ServiceTier)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="TIER_0">Tier 0 - Core Transactional / Mission Critical</option>
                <option value="TIER_1">Tier 1 - Business & Customer Facing</option>
                <option value="TIER_2">Tier 2 - Internal & Asynchronous Processing</option>
                <option value="TIER_3">Tier 3 - Non-Critical Utilities & Batch Jobs</option>
              </select>
            </div>
          </div>

          {/* Commander & Users Impacted */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Incident Commander *
              </label>
              <input
                type="text"
                required
                value={incidentCommander}
                onChange={(e) => setIncidentCommander(e.target.value)}
                placeholder="e.g. Alex Mercer (Staff SRE)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Estimated Users Impacted (Blast Radius)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={impactedUsersCount}
                  onChange={(e) => setImpactedUsersCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Financial Loss Rate & Data Loss Risk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Estimated Financial Burn ($/hour)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={financialLossPerHour}
                  onChange={(e) => setFinancialLossPerHour(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Data Integrity / Loss Risk
              </label>
              <select
                value={dataLossRisk}
                onChange={(e) => setDataLossRisk(e.target.value as DataLossRisk)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="NONE">None - Read-only / Ephemeral data</option>
                <option value="POSSIBLE">Possible - Cache desync / queued items</option>
                <option value="CONFIRMED">Confirmed - Ledger / Transactional loss</option>
              </select>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Initial Symptom Summary
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe error patterns, latency spikes, or failed downstream calls..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Live Dynamic Severity Scoring Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                Dynamic Severity Calculation
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Score: <strong>{previewCalculation.score}/100</strong></span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${previewCalculation.badgeColor}`}>
                  {previewCalculation.severity}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-900">
              <div className="text-slate-400">
                SLA Ack Target: <strong className="text-slate-200">{previewCalculation.slaAck}</strong>
              </div>
              <div className="text-slate-400">
                SLA Resolve Target: <strong className="text-slate-200">{previewCalculation.slaResolve}</strong>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {previewCalculation.rationale.map((r, i) => (
                <span key={i} className="text-[11px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-5 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg hover:shadow-rose-600/25 transition disabled:opacity-50"
            >
              {loading ? 'Declaring...' : 'Declare & Start Command'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
