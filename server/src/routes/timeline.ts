import { Router, Request, Response } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/incidents/:id/timeline
router.get('/:id/timeline', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const events = db.prepare(`
      SELECT * FROM timeline_events 
      WHERE incidentId = ? 
      ORDER BY timestamp ASC
    `).all(id);

    res.json({ success: true, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/incidents/:id/timeline - Add timeline event
router.post('/:id/timeline', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      timestamp = new Date().toISOString(),
      phase,
      description,
      author = 'SRE On-Call',
      systemSource = 'Manual Investigation',
    } = req.body;

    if (!description || !phase) {
      return res.status(400).json({
        success: false,
        error: 'Description and phase are required',
      });
    }

    const inc = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
    if (!inc) {
      return res.status(404).json({ success: false, error: `Incident ${id} not found` });
    }

    const eventId = `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO timeline_events (id, incidentId, timestamp, phase, description, author, systemSource, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(eventId, id, timestamp, phase, description, author, systemSource, now);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, incidentId, action, actor, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      id,
      'TIMELINE_EVENT_ADDED',
      author,
      `Phase [${phase}]: ${description}`,
      now
    );

    const created = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(eventId);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/incidents/:id/timeline/:eventId
router.delete('/:id/timeline/:eventId', (req: Request, res: Response) => {
  try {
    const { id, eventId } = req.params;
    db.prepare('DELETE FROM timeline_events WHERE id = ? AND incidentId = ?').run(eventId, id);
    res.json({ success: true, message: 'Timeline event deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
