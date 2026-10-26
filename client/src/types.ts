export type IncidentSeverity = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';

export type IncidentStatus = 
  | 'INVESTIGATING' 
  | 'IDENTIFIED' 
  | 'MONITORING' 
  | 'RESOLVED' 
  | 'CLOSED';

export type ServiceTier = 'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3';

export type Criticality = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type DataLossRisk = 'NONE' | 'POSSIBLE' | 'CONFIRMED';

export type TimelinePhase = 
  | 'DETECTION' 
  | 'DIAGNOSIS' 
  | 'MITIGATION' 
  | 'RESOLUTION' 
  | 'COMMUNICATION';

export type RootCauseCategory = 
  | 'INFRASTRUCTURE' 
  | 'CODE_DEFECT' 
  | 'CONFIGURATION' 
  | 'PROCESS' 
  | 'DEPENDENCY';

export type ActionPriority = 'P0_BLOCKER' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';

export type ActionStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';

export type PreventativeCategory = 
  | 'ARCHITECTURAL_RESILIENCE' 
  | 'MONITORING_ALERTING' 
  | 'RUNBOOK_PROCESS' 
  | 'CHAOS_TESTING' 
  | 'AUTOMATION';

export interface Incident {
  id: string;
  title: string;
  summary: string;
  service: string;
  serviceTier: ServiceTier;
  severity: IncidentSeverity;
  severityScore: number;
  status: IncidentStatus;
  incidentCommander: string;
  impactedUsersCount: number;
  businessCriticality: Criticality;
  financialLossPerHour: number;
  calculatedLoss: number;
  dataLossRisk: DataLossRisk;
  detectedAt: string;
  acknowledgedAt?: string | null;
  mitigatedAt?: string | null;
  resolvedAt?: string | null;
  slaBreached: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  incidentId: string;
  timestamp: string;
  phase: TimelinePhase;
  description: string;
  author: string;
  systemSource?: string;
  createdAt: string;
}

export interface RootCause {
  id: string;
  incidentId: string;
  whyLevel: number;
  question: string;
  answer: string;
  category: RootCauseCategory;
  isTerminalRootCause: number;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  incidentId: string;
  title: string;
  description?: string;
  owner: string;
  priority: ActionPriority;
  status: ActionStatus;
  dueDate: string;
  preventativeCategory: PreventativeCategory;
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  incidentId: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
}

export interface FullIncident extends Incident {
  timeline: TimelineEvent[];
  rootCauses: RootCause[];
  actionItems: ActionItem[];
  auditLogs: AuditLog[];
  calculatedMetrics?: {
    timeToAcknowledgeMinutes: number;
    timeToMitigateMinutes: number;
    timeToResolveMinutes: number;
    totalDowntimeMinutes: number;
    estimatedCost: number;
    slaTargetMinutes: number;
    isSlaBreached: boolean;
  };
}

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
