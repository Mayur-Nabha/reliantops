import { FullIncident } from '../types.js';
import { computeIncidentIntervals } from './metricsEngine.js';

export function generatePostMortemMarkdown(incident: FullIncident): string {
  const intervals = computeIncidentIntervals(incident);
  const detected = new Date(incident.detectedAt).toUTCString();
  const ack = incident.acknowledgedAt ? new Date(incident.acknowledgedAt).toUTCString() : 'Pending';
  const mit = incident.mitigatedAt ? new Date(incident.mitigatedAt).toUTCString() : 'Pending';
  const res = incident.resolvedAt ? new Date(incident.resolvedAt).toUTCString() : 'Ongoing / Unresolved';

  let md = `# Incident Post-Mortem: ${incident.title} (${incident.id})\n\n`;
  md += `> **Status:** ${incident.status} | **Severity:** ${incident.severity} (Score: ${incident.severityScore}/100) | **Service:** ${incident.service} (${incident.serviceTier})\n`;
  md += `> **Incident Commander:** ${incident.incidentCommander}\n\n`;

  md += `## 1. Executive Summary\n\n`;
  md += `${incident.summary}\n\n`;

  md += `## 2. Impact & Reliability Metrics\n\n`;
  md += `| Metric | Value |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Impacted Users** | ${incident.impactedUsersCount.toLocaleString()} |\n`;
  md += `| **Business Criticality** | ${incident.businessCriticality} |\n`;
  md += `| **Data Loss Risk** | ${incident.dataLossRisk} |\n`;
  md += `| **Financial Loss Rate** | $${incident.financialLossPerHour.toLocaleString()} / hour |\n`;
  md += `| **Total Estimated Downtime Loss** | $${incident.calculatedLoss.toLocaleString()} |\n`;
  md += `| **Total Outage Duration** | ${intervals.totalDowntimeMinutes} minutes |\n`;
  md += `| **Time to Acknowledge (MTTA)** | ${intervals.timeToAcknowledgeMinutes} minutes |\n`;
  md += `| **Time to Mitigate (MTTM)** | ${intervals.timeToMitigateMinutes} minutes |\n`;
  md += `| **Time to Resolve (MTTR)** | ${intervals.timeToResolveMinutes} minutes |\n`;
  md += `| **SLA Target Duration** | ${intervals.slaTargetMinutes} minutes |\n`;
  md += `| **SLA Status** | ${intervals.isSlaBreached ? '⚠️ SLA BREACHED' : '✅ SLA MET'} |\n\n`;

  md += `## 3. Incident Timeline & Milestones\n\n`;
  md += `- **Detected:** \`${detected}\`\n`;
  md += `- **Acknowledged:** \`${ack}\`\n`;
  md += `- **Mitigated:** \`${mit}\`\n`;
  md += `- **Resolved:** \`${res}\`\n\n`;

  if (incident.timeline && incident.timeline.length > 0) {
    md += `### Chronological Event Log\n\n`;
    md += `| Time (UTC) | Phase | Source | Description | Author |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    const sorted = [...incident.timeline].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    for (const evt of sorted) {
      const time = new Date(evt.timestamp).toUTCString();
      md += `| ${time} | \`${evt.phase}\` | ${evt.systemSource || 'System'} | ${evt.description} | ${evt.author} |\n`;
    }
    md += `\n`;
  }

  md += `## 4. Root Cause Analysis (5-Whys Method)\n\n`;
  if (incident.rootCauses && incident.rootCauses.length > 0) {
    const sortedWhys = [...incident.rootCauses].sort((a, b) => a.whyLevel - b.whyLevel);
    for (const rc of sortedWhys) {
      md += `### Level ${rc.whyLevel}: ${rc.question}\n`;
      md += `**Answer:** ${rc.answer}  \n`;
      md += `*Factor Category:* \`${rc.category}\` ${rc.isTerminalRootCause ? '**(Identified Root Cause)**' : ''}\n\n`;
    }
  } else {
    md += `*Root cause analysis has not been populated yet.*\n\n`;
  }

  md += `## 5. Preventative Action Items & Safeguards\n\n`;
  if (incident.actionItems && incident.actionItems.length > 0) {
    md += `| Priority | Title | Owner | Target Date | Category | Status |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    for (const item of incident.actionItems) {
      md += `| \`${item.priority}\` | ${item.title} | ${item.owner} | ${item.dueDate} | ${item.preventativeCategory} | **${item.status}** |\n`;
    }
    md += `\n`;
  } else {
    md += `*No action items logged yet.*\n\n`;
  }

  md += `## 6. Audit Trail & Approvals\n\n`;
  if (incident.auditLogs && incident.auditLogs.length > 0) {
    for (const log of incident.auditLogs) {
      const parsedTime = isNaN(Number(log.timestamp)) ? new Date(log.timestamp) : new Date(Number(log.timestamp));
      const formatted = isNaN(parsedTime.getTime()) ? new Date().toUTCString() : parsedTime.toUTCString();
      md += `- **[${formatted}]** \`${log.action}\` by *${log.actor}*: ${log.details}\n`;
    }
    md += `\n`;
  }

  md += `---\n*Generated automatically by ReliantOps SRE Platform on ${new Date().toUTCString()}*\n`;
  return md;
}
