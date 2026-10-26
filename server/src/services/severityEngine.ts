import { Criticality, DataLossRisk, IncidentSeverity, ServiceTier } from '../types.js';

export interface SeverityInputs {
  serviceTier: ServiceTier;
  impactedUsersCount: number;
  businessCriticality: Criticality;
  financialLossPerHour: number;
  dataLossRisk: DataLossRisk;
}

export interface SeverityResult {
  score: number;
  severity: IncidentSeverity;
  slaAcknowledgeMinutes: number;
  slaResolveMinutes: number;
  rationale: string[];
}

export function calculateSeverity(inputs: SeverityInputs): SeverityResult {
  let score = 0;
  const rationale: string[] = [];

  // 1. Service Tier Scoring (Max 35 pts)
  switch (inputs.serviceTier) {
    case 'TIER_0':
      score += 35;
      rationale.push('Tier 0 mission-critical core service (+35 pts)');
      break;
    case 'TIER_1':
      score += 25;
      rationale.push('Tier 1 revenue-impacting business service (+25 pts)');
      break;
    case 'TIER_2':
      score += 15;
      rationale.push('Tier 2 internal or asynchronous service (+15 pts)');
      break;
    case 'TIER_3':
      score += 5;
      rationale.push('Tier 3 non-critical utility service (+5 pts)');
      break;
  }

  // 2. Impacted User Population (Max 25 pts)
  if (inputs.impactedUsersCount >= 50000) {
    score += 25;
    rationale.push(`High user blast radius (${inputs.impactedUsersCount.toLocaleString()} users, +25 pts)`);
  } else if (inputs.impactedUsersCount >= 10000) {
    score += 18;
    rationale.push(`Moderate user blast radius (${inputs.impactedUsersCount.toLocaleString()} users, +18 pts)`);
  } else if (inputs.impactedUsersCount >= 1000) {
    score += 12;
    rationale.push(`Localized user impact (${inputs.impactedUsersCount.toLocaleString()} users, +12 pts)`);
  } else if (inputs.impactedUsersCount >= 100) {
    score += 6;
    rationale.push(`Minimal user impact (${inputs.impactedUsersCount.toLocaleString()} users, +6 pts)`);
  } else {
    score += 2;
    rationale.push(`Negligible user impact (<100 users, +2 pts)`);
  }

  // 3. Data Integrity & Loss Risk (Max 25 pts)
  if (inputs.dataLossRisk === 'CONFIRMED') {
    score += 25;
    rationale.push('Confirmed data loss / corruption risk (+25 pts)');
  } else if (inputs.dataLossRisk === 'POSSIBLE') {
    score += 15;
    rationale.push('Suspected data loss / consistency risk (+15 pts)');
  }

  // 4. Financial Velocity / Revenue Loss per hour (Max 15 pts)
  if (inputs.financialLossPerHour >= 50000) {
    score += 15;
    rationale.push(`High financial burn rate ($${inputs.financialLossPerHour.toLocaleString()}/hr, +15 pts)`);
  } else if (inputs.financialLossPerHour >= 10000) {
    score += 10;
    rationale.push(`Moderate financial burn rate ($${inputs.financialLossPerHour.toLocaleString()}/hr, +10 pts)`);
  } else if (inputs.financialLossPerHour > 0) {
    score += 5;
    rationale.push(`Minor financial impact ($${inputs.financialLossPerHour.toLocaleString()}/hr, +5 pts)`);
  }

  // Determine Severity and SLA thresholds
  let severity: IncidentSeverity = 'P4_LOW';
  let slaAcknowledgeMinutes = 120;
  let slaResolveMinutes = 1440; // 24 hours

  if (score >= 75) {
    severity = 'P1_CRITICAL';
    slaAcknowledgeMinutes = 15;
    slaResolveMinutes = 60; // 1 hour
  } else if (score >= 50) {
    severity = 'P2_HIGH';
    slaAcknowledgeMinutes = 30;
    slaResolveMinutes = 240; // 4 hours
  } else if (score >= 25) {
    severity = 'P3_MEDIUM';
    slaAcknowledgeMinutes = 60;
    slaResolveMinutes = 720; // 12 hours
  }

  return {
    score: Math.min(100, Math.round(score)),
    severity,
    slaAcknowledgeMinutes,
    slaResolveMinutes,
    rationale,
  };
}

export function getSlaTargets(severity: IncidentSeverity): { ackMinutes: number; resolveMinutes: number } {
  switch (severity) {
    case 'P1_CRITICAL':
      return { ackMinutes: 15, resolveMinutes: 60 };
    case 'P2_HIGH':
      return { ackMinutes: 30, resolveMinutes: 240 };
    case 'P3_MEDIUM':
      return { ackMinutes: 60, resolveMinutes: 720 };
    case 'P4_LOW':
    default:
      return { ackMinutes: 120, resolveMinutes: 1440 };
  }
}
