import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { runDatabaseSeed } from '../services/seedData.js';

const router = Router();

router.post('/seed', (req: Request, res: Response) => {
  try {
    runDatabaseSeed();
    res.json({
      success: true,
      message: 'Demo dataset successfully loaded with 3 realistic SRE incident scenarios!',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/reset - Wipe all data
router.post('/reset', (req: Request, res: Response) => {
  try {
    db.exec(`
      DELETE FROM audit_logs;
      DELETE FROM action_items;
      DELETE FROM root_causes;
      DELETE FROM timeline_events;
      DELETE FROM incidents;
    `);
    res.json({ success: true, message: 'All incident database tables cleared.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
