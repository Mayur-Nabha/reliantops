import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { computeSystemMetrics } from '../services/metricsEngine.js';
import { Incident } from '../types.js';

const router = Router();

// GET /api/analytics/overview
router.get('/overview', (req: Request, res: Response) => {
  try {
    const incidents = db.prepare('SELECT * FROM incidents ORDER BY createdAt DESC').all() as Incident[];
    const overview = computeSystemMetrics(incidents);

    res.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/analytics/export/:id/markdown
router.get('/export/:id/markdown', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { generatePostMortemMarkdown } = await import('../services/postMortemGenerator.js');

    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id) as Incident | undefined;
    if (!incident) {
      return res.status(404).json({ success: false, error: `Incident ${id} not found` });
    }

    const timeline = db.prepare('SELECT * FROM timeline_events WHERE incidentId = ? ORDER BY timestamp ASC').all(id) as any[];
    const rootCauses = db.prepare('SELECT * FROM root_causes WHERE incidentId = ? ORDER BY whyLevel ASC').all(id) as any[];
    const actionItems = db.prepare('SELECT * FROM action_items WHERE incidentId = ? ORDER BY createdAt DESC').all(id) as any[];
    const auditLogs = db.prepare('SELECT * FROM audit_logs WHERE incidentId = ? ORDER BY timestamp DESC').all(id) as any[];

    const md = generatePostMortemMarkdown({
      ...incident,
      timeline,
      rootCauses,
      actionItems,
      auditLogs,
    });

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${id}-post-mortem.md"`);
    res.send(md);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
