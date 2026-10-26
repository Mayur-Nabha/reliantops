import { Incident } from '../types.js';
import { getSlaTargets } from './severityEngine.js';

export interface ReliabilityOverview {
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  slaBreachCount: number;
  slaCompliancePercentage: number;
  meanTimeToAcknowledgeMinutes: number;
  meanTimeToMitigateMinutes: number;
  meanTimeToResolveMinutes: number;
  totalCalculatedFinancialLoss: number;
  reliabilityHealthScore: number;
  incidentsBySeverity: {
    P1_CRITICAL: number;
    P2_HIGH: number;
    P3_MEDIUM: number;
    P4_LOW: number;
  };
  serviceHealth: {
    service: string;
    tier: string;
    incidentCount: number;
    totalDowntimeMinutes: number;
    slaBreachRate: number;
    status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  }[];
}

export function computeIncidentIntervals(incident: Incident): {
  timeToAcknowledgeMinutes: number;
  timeToMitigateMinutes: number;
  timeToResolveMinutes: number;
  totalDowntimeMinutes: number;
  isSlaBreached: boolean;
  slaTargetMinutes: number;
} {
  const detected = new Date(incident.detectedAt).getTime();
  const ack = incident.acknowledgedAt ? new Date(incident.acknowledgedAt).getTime() : null;
  const mit = incident.mitigatedAt ? new Date(incident.mitigatedAt).getTime() : null;
  const res = incident.resolvedAt ? new Date(incident.resolvedAt).getTime() : Date.now();

  const slaTargets = getSlaTargets(incident.severity);
  const slaTargetMinutes = slaTargets.resolveMinutes;

  const timeToAcknowledgeMinutes = ack ? Math.max(0, Math.round((ack - detected) / 60000)) : 0;
  const timeToMitigateMinutes = mit ? Math.max(0, Math.round((mit - detected) / 60000)) : 0;
  const timeToResolveMinutes = incident.resolvedAt ? Math.max(0, Math.round((res - detected) / 60000)) : Math.max(0, Math.round((Date.now() - detected) / 60000));
  const totalDowntimeMinutes = timeToResolveMinutes;

  const isSlaBreached = totalDowntimeMinutes > slaTargetMinutes;

  return {
    timeToAcknowledgeMinutes,
    timeToMitigateMinutes,
    timeToResolveMinutes,
    totalDowntimeMinutes,
    isSlaBreached,
    slaTargetMinutes,
  };
}

export function computeSystemMetrics(incidents: Incident[]): ReliabilityOverview {
  const totalIncidents = incidents.length;
  let activeIncidents = 0;
  let resolvedIncidents = 0;
  let slaBreachCount = 0;

  let totalAckMinutes = 0;
  let ackCount = 0;
  let totalMitMinutes = 0;
  let mitCount = 0;
  let totalResMinutes = 0;
  let resCount = 0;

  let totalLoss = 0;

  const severityCounts = {
    P1_CRITICAL: 0,
    P2_HIGH: 0,
    P3_MEDIUM: 0,
    P4_LOW: 0,
  };

  const serviceMap = new Map<string, {
    service: string;
    tier: string;
    count: number;
    downtime: number;
    breaches: number;
  }>();

  for (const inc of incidents) {
    if (inc.status === 'RESOLVED' || inc.status === 'CLOSED') {
      resolvedIncidents++;
    } else {
      activeIncidents++;
    }

    if (inc.severity in severityCounts) {
      severityCounts[inc.severity as keyof typeof severityCounts]++;
    }

    const intervals = computeIncidentIntervals(inc);

    if (intervals.isSlaBreached || inc.slaBreached === 1) {
      slaBreachCount++;
    }

    if (inc.acknowledgedAt) {
      totalAckMinutes += intervals.timeToAcknowledgeMinutes;
      ackCount++;
    }

    if (inc.mitigatedAt) {
      totalMitMinutes += intervals.timeToMitigateMinutes;
      mitCount++;
    }

    if (inc.resolvedAt) {
      totalResMinutes += intervals.timeToResolveMinutes;
      resCount++;
    }

    // Accumulate calculated loss
    totalLoss += inc.calculatedLoss || 0;

    // Service tracking
    const existing = serviceMap.get(inc.service) || {
      service: inc.service,
      tier: inc.serviceTier,
      count: 0,
      downtime: 0,
      breaches: 0,
    };
    existing.count++;
    existing.downtime += intervals.totalDowntimeMinutes;
    if (intervals.isSlaBreached) existing.breaches++;
    serviceMap.set(inc.service, existing);
  }

  const mtta = ackCount > 0 ? Math.round(totalAckMinutes / ackCount) : 0;
  const mttm = mitCount > 0 ? Math.round(totalMitMinutes / mitCount) : 0;
  const mttr = resCount > 0 ? Math.round(totalResMinutes / resCount) : 0;

  const slaCompliance = totalIncidents > 0 
    ? Math.round(((totalIncidents - slaBreachCount) / totalIncidents) * 100) 
    : 100;

  // System Reliability Health Score (0 - 100)
  // Base 100 minus penalties for active P1s, SLA breaches, and high MTTR
  let healthScore = 100;
  healthScore -= (activeIncidents * 5);
  healthScore -= (severityCounts.P1_CRITICAL * 10);
  healthScore -= (slaBreachCount * 8);
  if (mttr > 120) healthScore -= 10;
  healthScore = Math.max(10, Math.min(100, healthScore));

  const serviceHealth = Array.from(serviceMap.values()).map(s => {
    const breachRate = s.count > 0 ? Math.round((s.breaches / s.count) * 100) : 0;
    let status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    if (breachRate > 40 || s.count >= 3) {
      status = 'CRITICAL';
    } else if (breachRate > 0 || s.count > 1) {
      status = 'DEGRADED';
    }

    return {
      service: s.service,
      tier: s.tier,
      incidentCount: s.count,
      totalDowntimeMinutes: s.downtime,
      slaBreachRate: breachRate,
      status,
    };
  });

  return {
    totalIncidents,
    activeIncidents,
    resolvedIncidents,
    slaBreachCount,
    slaCompliancePercentage: slaCompliance,
    meanTimeToAcknowledgeMinutes: mtta,
    meanTimeToMitigateMinutes: mttm,
    meanTimeToResolveMinutes: mttr,
    totalCalculatedFinancialLoss: totalLoss,
    reliabilityHealthScore: healthScore,
    incidentsBySeverity: severityCounts,
    serviceHealth,
  };
}
