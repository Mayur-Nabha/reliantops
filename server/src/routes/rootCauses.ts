import { Router, Request, Response } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/incidents/:id/root-cause
router.get('/:id/root-cause', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const causes = db.prepare(`
      SELECT * FROM root_causes 
      WHERE incidentId = ? 
      ORDER BY whyLevel ASC
    `).all(id);

    res.json({ success: true, data: causes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/incidents/:id/root-cause - Add 5-Whys level
router.post('/:id/root-cause', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      whyLevel,
      question,
      answer,
      category = 'INFRASTRUCTURE',
      isTerminalRootCause = 0,
      actor = 'Lead Investigator',
    } = req.body;

    if (!question || !answer || whyLevel === undefined) {
      return res.status(400).json({
        success: false,
        error: 'whyLevel, question, and answer are required',
      });
    }

    const inc = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
    if (!inc) {
      return res.status(404).json({ success: false, error: `Incident ${id} not found` });
    }

    const causeId = `RC-${Date.now()}-${whyLevel}`;
    const now = new Date().toISOString();

    // Check if this level already exists, if so update it
    const existing = db.prepare('SELECT * FROM root_causes WHERE incidentId = ? AND whyLevel = ?').get(id, whyLevel);
    if (existing) {
      db.prepare(`
        UPDATE root_causes
        SET question = ?, answer = ?, category = ?, isTerminalRootCause = ?
        WHERE incidentId = ? AND whyLevel = ?
      `).run(question, answer, category, isTerminalRootCause ? 1 : 0, id, whyLevel);
    } else {
      const stmt = db.prepare(`
        INSERT INTO root_causes (id, incidentId, whyLevel, question, answer, category, isTerminalRootCause, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(causeId, id, Number(whyLevel), question, answer, category, isTerminalRootCause ? 1 : 0, now);
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, incidentId, action, actor, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      id,
      'ROOT_CAUSE_UPDATED',
      actor,
      `Why-Level ${whyLevel} [${category}]: ${question} -> ${answer}`,
      now
    );

    const causes = db.prepare('SELECT * FROM root_causes WHERE incidentId = ? ORDER BY whyLevel ASC').all(id);
    res.status(201).json({ success: true, data: causes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/incidents/:id/root-cause/:causeId
router.delete('/:id/root-cause/:causeId', (req: Request, res: Response) => {
  try {
    const { id, causeId } = req.params;
    db.prepare('DELETE FROM root_causes WHERE id = ? AND incidentId = ?').run(causeId, id);
    res.json({ success: true, message: 'Root cause step removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
