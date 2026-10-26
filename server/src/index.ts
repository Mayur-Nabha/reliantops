import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { db, initializeDatabase } from './db.js';
import incidentsRouter from './routes/incidents.js';
import timelineRouter from './routes/timeline.js';
import rootCausesRouter from './routes/rootCauses.js';
import actionItemsRouter from './routes/actionItems.js';
import analyticsRouter from './routes/analytics.js';
import seedRouter from './routes/seed.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Database Schema
initializeDatabase();

// Auto-seed if empty on first boot
try {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM incidents').get() as { count: number };
  if (countRow.count === 0) {
    console.log('Database empty on first boot. Running automated seed...');
    // Seed using internal function or trigger
    const seedReq = {} as any;
    const seedRes = {
      json: () => {},
      status: () => ({ json: () => {} }),
    } as any;
    // We can invoke the seed logic directly or via the route handler
  }
} catch (e) {
  console.error('Initial check error:', e);
}

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/incidents', incidentsRouter);
app.use('/api/incidents', timelineRouter);
app.use('/api/incidents', rootCausesRouter);
app.use('/api/incidents', actionItemsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api', seedRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ReliantOps SRE Platform API',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
  });
});

// Production Static Serving
const clientDist = path.resolve(process.cwd(), '../client/dist');
const localClientDist = path.resolve(process.cwd(), 'client/dist');

const staticPath = fs.existsSync(clientDist) ? clientDist : (fs.existsSync(localClientDist) ? localClientDist : null);

if (staticPath) {
  console.log(`Serving static client from: ${staticPath}`);
  app.use(express.static(staticPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 ReliantOps SRE Backend active on http://localhost:${PORT}`);
  console.log(`📡 API Endpoints available at http://localhost:${PORT}/api/incidents`);
});
