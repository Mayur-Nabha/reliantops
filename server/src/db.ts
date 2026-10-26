import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'reliantops.db');
export const db = new DatabaseSync(dbPath);

export function initializeDatabase() {
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      service TEXT NOT NULL,
      serviceTier TEXT NOT NULL,
      severity TEXT NOT NULL,
      severityScore REAL NOT NULL,
      status TEXT NOT NULL,
      incidentCommander TEXT NOT NULL,
      impactedUsersCount INTEGER DEFAULT 0,
      businessCriticality TEXT DEFAULT 'HIGH',
      financialLossPerHour REAL DEFAULT 0,
      calculatedLoss REAL DEFAULT 0,
      dataLossRisk TEXT DEFAULT 'NONE',
      detectedAt TEXT NOT NULL,
      acknowledgedAt TEXT,
      mitigatedAt TEXT,
      resolvedAt TEXT,
      slaBreached INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
    CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
    CREATE INDEX IF NOT EXISTS idx_incidents_service ON incidents(service);

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      incidentId TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      phase TEXT NOT NULL,
      description TEXT NOT NULL,
      author TEXT NOT NULL,
      systemSource TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (incidentId) REFERENCES incidents(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_timeline_incidentId ON timeline_events(incidentId);
    CREATE INDEX IF NOT EXISTS idx_timeline_timestamp ON timeline_events(timestamp);

    CREATE TABLE IF NOT EXISTS root_causes (
      id TEXT PRIMARY KEY,
      incidentId TEXT NOT NULL,
      whyLevel INTEGER NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT NOT NULL,
      isTerminalRootCause INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (incidentId) REFERENCES incidents(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_rootcauses_incidentId ON root_causes(incidentId);

    CREATE TABLE IF NOT EXISTS action_items (
      id TEXT PRIMARY KEY,
      incidentId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      owner TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      preventativeCategory TEXT NOT NULL,
      verificationNotes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (incidentId) REFERENCES incidents(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_actionitems_incidentId ON action_items(incidentId);
    CREATE INDEX IF NOT EXISTS idx_actionitems_status ON action_items(status);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      incidentId TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      details TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_auditlogs_incidentId ON audit_logs(incidentId);
  `);
}
