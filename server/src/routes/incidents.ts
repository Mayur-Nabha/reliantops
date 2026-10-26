import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { calculateSeverity } from '../services/severityEngine.js';
import { computeIncidentIntervals } from '../services/metricsEngine.js';
import { FullIncident, Incident, IncidentStatus } from '../types.js';

const router = Router();

// GET /api/incidents - List with filters & search
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, severity, service, search } = req.query;

    let query = `SELECT * FROM incidents WHERE 1=1`;
    const params: any[] = [];

    if (status && typeof status === 'string' && status !== 'ALL') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (severity && typeof severity === 'string' && severity !== 'ALL') {
      query += ` AND severity = ?`;
      params.push(severity);
    }

    if (service && typeof service === 'string' && service !== 'ALL') {
      query += ` AND service = ?`;
      params.push(service);
    }

    if (search && typeof search === 'string') {
      query += ` AND (title LIKE ? OR summary LIKE ? OR id LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY createdAt DESC`;

    const stmt = db.prepare(query);
    const incidents = stmt.all(...params) as unknown as Incident[];

    res.json({
      success: true,
      data: incidents,
      count: incidents.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/incidents/:id - Get full incident details
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const incStmt = db.prepare(`SELECT * FROM incidents WHERE id = ?`);
    const incident = incStmt.get(id) as Incident | undefined;

    if (!incident) {
      return res.status(404).json({ success: false, error: `Incident ${id} not found` });
    }

    const timelineStmt = db.prepare(`SELECT * FROM timeline_events WHERE incidentId = ? ORDER BY timestamp ASC`);
    const timeline = timelineStmt.all(id) as any[];

    const rootCausesStmt = db.prepare(`SELECT * FROM root_causes WHERE incidentId = ? ORDER BY whyLevel ASC`);
    const rootCauses = rootCausesStmt.all(id) as any[];

    const actionItemsStmt = db.prepare(`SELECT * FROM action_items WHERE incidentId = ? ORDER BY createdAt DESC`);
    const actionItems = actionItemsStmt.all(id) as any[];

    const auditStmt = db.prepare(`SELECT * FROM audit_logs WHERE incidentId = ? ORDER BY timestamp DESC`);
    const auditLogs = auditStmt.all(id) as any[];

    const intervals = computeIncidentIntervals(incident);

    const full: FullIncident = {
      ...incident,
      timeline,
      rootCauses,
      actionItems,
      auditLogs,
      calculatedMetrics: {
        ...intervals,
        totalDowntimeMinutes: intervals.totalDowntimeMinutes,
        estimatedCost: incident.calculatedLoss,
      },
    };

    res.json({ success: true, data: full });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/incidents - Create new incident with automated severity scoring
router.post('/', (req: Request, res: Response) => {
  try {
    const {
      title,
      summary,
      service,
      serviceTier,
      incidentCommander,
      impactedUsersCount = 0,
      businessCriticality = 'HIGH',
      financialLossPerHour = 0,
      dataLossRisk = 'NONE',
      detectedAt = new Date().toISOString(),
    } = req.body;

    if (!title || !service || !incidentCommander) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, service, and incidentCommander are required',
      });
    }

    // Run dynamic severity score engine
    const severityResult = calculateSeverity({
      serviceTier: serviceTier || 'TIER_1',
      impactedUsersCount: Number(impactedUsersCount),
      businessCriticality,
      financialLossPerHour: Number(financialLossPerHour),
      dataLossRisk,
    });

    // Generate formatted ID: INC-YYYYMMDD-XXX
    const countRow = db.prepare('SELECT COUNT(*) as count FROM incidents').get() as { count: number };
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const incidentId = `INC-${datePrefix}-${String(countRow.count + 1).padStart(3, '0')}`;

    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO incidents (
        id, title, summary, service, serviceTier, severity, severityScore,
        status, incidentCommander, impactedUsersCount, businessCriticality,
        financialLossPerHour, calculatedLoss, dataLossRisk, detectedAt,
        acknowledgedAt, mitigatedAt, resolvedAt, slaBreached, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      incidentId,
      title,
      summary || 'Incident underway. Investigation initiated.',
      service,
      serviceTier || 'TIER_1',
      severityResult.severity,
      severityResult.score,
      'INVESTIGATING',
      incidentCommander,
      Number(impactedUsersCount),
      businessCriticality,
      Number(financialLossPerHour),
      0, // Initial calculated loss
      dataLossRisk,
      detectedAt,
      null, // acknowledgedAt
      null, // mitigatedAt
      null, // resolvedAt
      0,    // slaBreached
      now,
      now
    );

    // Initial timeline event
    const timelineStmt = db.prepare(`
      INSERT INTO timeline_events (id, incidentId, timestamp, phase, description, author, systemSource, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    timelineStmt.run(
      `EVT-${Date.now()}-1`,
      incidentId,
      detectedAt,
      'DETECTION',
      `Incident triggered: ${title}. Evaluated Severity: ${severityResult.severity} (${severityResult.score}/100)`,
      incidentCommander,
      'Automated Alert / Manual',
      now
    );

    // Audit log
    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (id, incidentId, action, actor, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    auditStmt.run(
      `AUD-${Date.now()}-1`,
      incidentId,
      'INCIDENT_CREATED',
      incidentCommander,
      `Created incident with Severity ${severityResult.severity} (Score: ${severityResult.score}). Rationale: ${severityResult.rationale.join('; ')}`,
      now
    );

    const created = db.prepare('SELECT * FROM incidents WHERE id = ?').get(incidentId);

    res.status(201).json({
      success: true,
      data: created,
      severityAnalysis: severityResult,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/incidents/:id - Status progression and field updates
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id) as Incident | undefined;

    if (!current) {
      return res.status(404).json({ success: false, error: `Incident ${id} not found` });
    }

    const {
      status,
      title,
      summary,
      incidentCommander,
      severity,
      financialLossPerHour,
      impactedUsersCount,
      actor = 'Commander',
    } = req.body;

    const now = new Date().toISOString();
    let acknowledgedAt = current.acknowledgedAt;
    let mitigatedAt = current.mitigatedAt;
    let resolvedAt = current.resolvedAt;
    let calculatedLoss = current.calculatedLoss;
    let slaBreached = current.slaBreached;

    // Handle status lifecycle transitions
    if (status && status !== current.status) {
      const validStatuses: IncidentStatus[] = ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: `Invalid status: ${status}` });
      }

      if (status === 'IDENTIFIED' && !acknowledgedAt) {
        acknowledgedAt = now;
      }
      if (status === 'MONITORING' && !mitigatedAt) {
        mitigatedAt = now;
      }
      if (status === 'RESOLVED' || status === 'CLOSED') {
        if (!resolvedAt) resolvedAt = now;
        // Compute total duration and calculated loss
        const detectedTime = new Date(current.detectedAt).getTime();
        const durationHours = (new Date(resolvedAt).getTime() - detectedTime) / 3600000;
        const lossRate = financialLossPerHour !== undefined ? Number(financialLossPerHour) : current.financialLossPerHour;
        calculatedLoss = Math.round(durationHours * lossRate);

        // Check SLA
        const intervals = computeIncidentIntervals({ ...current, resolvedAt });
        slaBreached = intervals.isSlaBreached ? 1 : 0;
      }

      // Log status transition to timeline
      const timelineStmt = db.prepare(`
        INSERT INTO timeline_events (id, incidentId, timestamp, phase, description, author, systemSource, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      let phase = 'DIAGNOSIS';
      if (status === 'MONITORING') phase = 'MITIGATION';
      if (status === 'RESOLVED' || status === 'CLOSED') phase = 'RESOLUTION';

      timelineStmt.run(
        `EVT-${Date.now()}`,
        id,
        now,
        phase,
        `Status transitioned from ${current.status} to ${status}`,
        actor,
        'Platform Workflow',
        now
      );
    }

    const updatedTitle = title || current.title;
    const updatedSummary = summary || current.summary;
    const updatedCommander = incidentCommander || current.incidentCommander;
    const updatedSeverity = severity || current.severity;
    const updatedLossRate = financialLossPerHour !== undefined ? Number(financialLossPerHour) : current.financialLossPerHour;
    const updatedUsers = impactedUsersCount !== undefined ? Number(impactedUsersCount) : current.impactedUsersCount;
    const updatedStatus = status || current.status;

    const updateStmt = db.prepare(`
      UPDATE incidents
      SET title = ?, summary = ?, incidentCommander = ?, severity = ?,
          status = ?, financialLossPerHour = ?, calculatedLoss = ?,
          impactedUsersCount = ?, acknowledgedAt = ?, mitigatedAt = ?,
          resolvedAt = ?, slaBreached = ?, updatedAt = ?
      WHERE id = ?
    `);

    updateStmt.run(
      updatedTitle,
      updatedSummary,
      updatedCommander,
      updatedSeverity,
      updatedStatus,
      updatedLossRate,
      calculatedLoss,
      updatedUsers,
      acknowledgedAt ?? null,
      mitigatedAt ?? null,
      resolvedAt ?? null,
      slaBreached,
      now,
      id
    );

    // Audit log
    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (id, incidentId, action, actor, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    auditStmt.run(
      `AUD-${Date.now()}`,
      id,
      'INCIDENT_UPDATED',
      actor,
      `Updated incident: Status=${updatedStatus}, Severity=${updatedSeverity}`,
      now
    );

    const updated = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/incidents/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ success: false, error: `Incident ${id} not found` });
    }

    db.prepare('DELETE FROM incidents WHERE id = ?').run(id);
    res.json({ success: true, message: `Incident ${id} deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
