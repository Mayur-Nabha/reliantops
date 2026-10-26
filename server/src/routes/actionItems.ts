import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { ActionItem } from '../types.js';

const router = Router();

// GET /api/incidents/:id/action-items
router.get('/:id/action-items', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const items = db.prepare(`
      SELECT * FROM action_items 
      WHERE incidentId = ? 
      ORDER BY createdAt DESC
    `).all(id);

    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/incidents/:id/action-items - Create new action item
router.post('/:id/action-items', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description = '',
      owner,
      priority = 'P1_HIGH',
      status = 'TODO',
      dueDate,
      preventativeCategory = 'ARCHITECTURAL_RESILIENCE',
      actor = 'Engineering Lead',
    } = req.body;

    if (!title || !owner) {
      return res.status(400).json({
        success: false,
        error: 'title and owner are required',
      });
    }

    const inc = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
    if (!inc) {
      return res.status(404).json({ success: false, error: `Incident ${id} not found` });
    }

    const itemId = `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const defaultDueDate = dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const stmt = db.prepare(`
      INSERT INTO action_items (
        id, incidentId, title, description, owner, priority, status,
        dueDate, preventativeCategory, verificationNotes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      itemId,
      id,
      title,
      description,
      owner,
      priority,
      status,
      defaultDueDate,
      preventativeCategory,
      '',
      now,
      now
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, incidentId, action, actor, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      id,
      'ACTION_ITEM_CREATED',
      actor,
      `[${priority}] ${title} assigned to ${owner}`,
      now
    );

    const created = db.prepare('SELECT * FROM action_items WHERE id = ?').get(itemId);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/incidents/:id/action-items/:itemId - Update status or verification notes
router.patch('/:id/action-items/:itemId', (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const current = db.prepare('SELECT * FROM action_items WHERE id = ? AND incidentId = ?').get(itemId, id) as ActionItem | undefined;

    if (!current) {
      return res.status(404).json({ success: false, error: `Action item ${itemId} not found` });
    }

    const { status, verificationNotes, priority, owner, title, actor = 'Engineer' } = req.body;
    const now = new Date().toISOString();

    const updatedStatus = status || current.status;
    const updatedNotes = verificationNotes !== undefined ? verificationNotes : current.verificationNotes;
    const updatedPriority = priority || current.priority;
    const updatedOwner = owner || current.owner;
    const updatedTitle = title || current.title;

    db.prepare(`
      UPDATE action_items
      SET status = ?, verificationNotes = ?, priority = ?, owner = ?, title = ?, updatedAt = ?
      WHERE id = ? AND incidentId = ?
    `).run(updatedStatus, updatedNotes, updatedPriority, updatedOwner, updatedTitle, now, itemId, id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, incidentId, action, actor, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `AUD-${Date.now()}`,
      id,
      'ACTION_ITEM_UPDATED',
      actor,
      `Action ${itemId} status set to ${updatedStatus}`,
      now
    );

    const updated = db.prepare('SELECT * FROM action_items WHERE id = ?').get(itemId);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/incidents/:id/action-items/:itemId
router.delete('/:id/action-items/:itemId', (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    db.prepare('DELETE FROM action_items WHERE id = ? AND incidentId = ?').run(itemId, id);
    res.json({ success: true, message: 'Action item deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
