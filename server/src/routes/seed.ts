import { Router, Request, Response } from 'express';
import { db } from '../db.js';

const router = Router();

router.post('/seed', (req: Request, res: Response) => {
  try {
    // Clear existing tables
    db.exec(`
      DELETE FROM audit_logs;
      DELETE FROM action_items;
      DELETE FROM root_causes;
      DELETE FROM timeline_events;
      DELETE FROM incidents;
    `);

    const now = Date.now();
    const d1 = new Date(now - 1000 * 60 * 180).toISOString(); // 3 hours ago
    const a1 = new Date(now - 1000 * 60 * 168).toISOString(); // 12m after
    const m1 = new Date(now - 1000 * 60 * 135).toISOString(); // 45m after
    const r1 = new Date(now - 1000 * 60 * 120).toISOString(); // 60m after (Resolved)

    const d2 = new Date(now - 1000 * 60 * 75).toISOString(); // 75m ago
    const a2 = new Date(now - 1000 * 60 * 60).toISOString(); // 15m after
    const m2 = new Date(now - 1000 * 60 * 25).toISOString(); // 50m after (Monitoring)

    const d3 = new Date(now - 1000 * 60 * 20).toISOString(); // 20m ago (Investigating)

    // Insert Incident 1: P1 Critical Payment Gateway
    db.prepare(`
      INSERT INTO incidents (
        id, title, summary, service, serviceTier, severity, severityScore,
        status, incidentCommander, impactedUsersCount, businessCriticality,
        financialLossPerHour, calculatedLoss, dataLossRisk, detectedAt,
        acknowledgedAt, mitigatedAt, resolvedAt, slaBreached, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'INC-20261026-001',
      'Payment Gateway TLS Handshake Saturation & Webhook Timeout Cascade',
      'Elevated 504 Gateway Timeouts across Stripe and Adyen webhook ingestion pipelines. Transaction processing failed for 42 minutes during peak morning traffic before keep-alive pools were resized.',
      'Payment Gateway',
      'TIER_0',
      'P1_CRITICAL',
      88,
      'RESOLVED',
      'Alex Mercer (Staff SRE)',
      84200,
      'CRITICAL',
      72000,
      48000,
      'POSSIBLE',
      d1,
      a1,
      m1,
      r1,
      0,
      d1,
      r1
    );

    // Incident 1 Timeline
    const insertTimeline = db.prepare(`
      INSERT INTO timeline_events (id, incidentId, timestamp, phase, description, author, systemSource, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTimeline.run('EVT-101', 'INC-20261026-001', d1, 'DETECTION', 'Datadog Alert triggered: Webhook P99 latency exceeded 4,500ms (threshold: 800ms). Error rate spiked to 14.8%.', 'Datadog Monitor', 'Prometheus/Datadog', d1);
    insertTimeline.run('EVT-102', 'INC-20261026-001', a1, 'DIAGNOSIS', 'Alex Mercer acknowledged PagerDuty alert and declared P1 incident channel #inc-20261026-payment.', 'Alex Mercer', 'PagerDuty', a1);
    insertTimeline.run('EVT-103', 'INC-20261026-001', new Date(now - 1000 * 60 * 155).toISOString(), 'DIAGNOSIS', 'Correlated tcpdump logs revealed high TLS renegotiation overhead between Envoy edge proxy and internal billing workers.', 'Maya Lin (NetSec)', 'tcpdump / Wireshark', a1);
    insertTimeline.run('EVT-104', 'INC-20261026-001', m1, 'MITIGATION', 'Applied dynamic Envoy hot-config patch: doubled TLS session cache size to 65k entries and increased worker keep-alive timeout to 120s.', 'Alex Mercer', 'Kubernetes Helm', m1);
    insertTimeline.run('EVT-105', 'INC-20261026-001', r1, 'RESOLUTION', 'Transaction success rate restored to 99.98%. Backlogged webhooks drained through dead-letter retry queue.', 'Alex Mercer', 'Payment Ops', r1);

    // Incident 1 5-Whys
    const insertRootCause = db.prepare(`
      INSERT INTO root_causes (id, incidentId, whyLevel, question, answer, category, isTerminalRootCause, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertRootCause.run('RC-101', 'INC-20261026-001', 1, 'Why did the payment service return 504 Gateway Timeouts?', 'Inbound webhook HTTP connections timed out waiting for upstream TLS handshakes.', 'INFRASTRUCTURE', 0, d1);
    insertRootCause.run('RC-102', 'INC-20261026-001', 2, 'Why did upstream TLS handshakes take over 4 seconds?', 'Envoy proxy exhausted its in-memory TLS session ticket cache under sudden traffic surge.', 'CONFIGURATION', 0, d1);
    insertRootCause.run('RC-103', 'INC-20261026-001', 3, 'Why was the TLS session cache sized to only 8,192 entries?', 'Default settings from staging were deployed directly without production load tuning.', 'PROCESS', 0, d1);
    insertRootCause.run('RC-104', 'INC-20261026-001', 4, 'Why was there no automated load test verification before deploying edge proxy configuration?', 'Edge network configurations were managed via unverified Helm override files without staging soak tests.', 'PROCESS', 0, d1);
    insertRootCause.run('RC-105', 'INC-20261026-001', 5, 'Root Cause: Why did CI/CD lack edge infrastructure regression tests?', 'Lacked automated chaos and soak testing gate in the network infrastructure deployment pipeline.', 'ARCHITECTURAL_RESILIENCE', 1, d1);

    // Incident 1 Action Items
    const insertAction = db.prepare(`
      INSERT INTO action_items (id, incidentId, title, description, owner, priority, status, dueDate, preventativeCategory, verificationNotes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAction.run(
      'ACT-101',
      'INC-20261026-001',
      'Automate Envoy TLS cache tuning in Terraform infrastructure modules',
      'Ensure TLS session cache sizing is dynamically computed based on replica node memory and peak QPS.',
      'Maya Lin',
      'P0_BLOCKER',
      'VERIFIED',
      new Date(now + 86400000 * 3).toISOString().slice(0, 10),
      'ARCHITECTURAL_RESILIENCE',
      'Verified in staging load test simulating 150k handshakes/sec. Zero cache evictions observed.',
      d1,
      r1
    );
    insertAction.run(
      'ACT-102',
      'INC-20261026-001',
      'Deploy synthetic TLS handshake latency probe alert in Datadog',
      'Alert on edge handshake latency > 200ms before customers observe HTTP 504 errors.',
      'Devin Vance',
      'P1_HIGH',
      'COMPLETED',
      new Date(now + 86400000 * 5).toISOString().slice(0, 10),
      'MONITORING_ALERTING',
      'Canary probe operational across all 3 AWS regions.',
      d1,
      r1
    );

    // Insert Incident 2: P2 High Postgres Lock Contention
    db.prepare(`
      INSERT INTO incidents (
        id, title, summary, service, serviceTier, severity, severityScore,
        status, incidentCommander, impactedUsersCount, businessCriticality,
        financialLossPerHour, calculatedLoss, dataLossRisk, detectedAt,
        acknowledgedAt, mitigatedAt, resolvedAt, slaBreached, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'INC-20261026-002',
      'Primary PostgreSQL Connection Pool Saturation on User Auth Service',
      'Unindexed migration query on user_sessions table held exclusive table locks during peak login surge, exhausting PgBouncer connection pool.',
      'Auth Service',
      'TIER_1',
      'P2_HIGH',
      62,
      'MONITORING',
      'Rachel Chen (Principal SRE)',
      12400,
      'HIGH',
      18000,
      14500,
      'NONE',
      d2,
      a2,
      m2,
      null,
      0,
      d2,
      m2
    );

    insertTimeline.run('EVT-201', 'INC-20261026-002', d2, 'DETECTION', 'Alert: PgBouncer active client connections reached 98% capacity (490/500). User login latency exceeded 3,200ms.', 'CloudWatch Alarm', 'AWS RDS', d2);
    insertTimeline.run('EVT-202', 'INC-20261026-002', a2, 'DIAGNOSIS', 'Rachel Chen acknowledged alert. Executed pg_stat_activity to inspect blocking queries.', 'Rachel Chen', 'Postgres Admin', a2);
    insertTimeline.run('EVT-203', 'INC-20261026-002', m2, 'MITIGATION', 'Terminated blocking migration backend PID 4192. Added CONCURRENTLY clause to index creation in background.', 'Rachel Chen', 'SRE Console', m2);

    insertRootCause.run('RC-201', 'INC-20261026-002', 1, 'Why did authentication requests stall?', 'PgBouncer connection pool was 100% saturated with waiting backend queries.', 'INFRASTRUCTURE', 0, d2);
    insertRootCause.run('RC-202', 'INC-20261026-002', 2, 'Why were backend queries waiting?', 'A background migration ran ALTER TABLE without CONCURRENTLY, taking AccessExclusiveLock.', 'CODE_DEFECT', 1, d2);

    insertAction.run(
      'ACT-201',
      'INC-20261026-002',
      'Enforce strong-migrations linter in CI for all DDL pull requests',
      'Block any Prisma / SQL migration that takes exclusive table locks without CONCURRENTLY.',
      'Siddharth Rao',
      'P1_HIGH',
      'IN_PROGRESS',
      new Date(now + 86400000 * 4).toISOString().slice(0, 10),
      'AUTOMATION',
      '',
      d2,
      m2
    );

    // Insert Incident 3: P3 Medium Catalog Search Ingestion Lag
    db.prepare(`
      INSERT INTO incidents (
        id, title, summary, service, serviceTier, severity, severityScore,
        status, incidentCommander, impactedUsersCount, businessCriticality,
        financialLossPerHour, calculatedLoss, dataLossRisk, detectedAt,
        acknowledgedAt, mitigatedAt, resolvedAt, slaBreached, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'INC-20261026-003',
      'Catalog Search Elasticsearch Ingestion Consumer Lag Spiking',
      'Kafka consumer group for Elasticsearch product updates fell behind by 240,000 messages following vendor inventory sync.',
      'Catalog Search',
      'TIER_2',
      'P3_MEDIUM',
      38,
      'INVESTIGATING',
      'Karan Patel (On-Call SRE)',
      2100,
      'MEDIUM',
      3200,
      1066,
      'NONE',
      d3,
      null,
      null,
      null,
      0,
      d3,
      d3
    );

    insertTimeline.run('EVT-301', 'INC-20261026-003', d3, 'DETECTION', 'Kafka consumer lag alert triggered for topic catalog.inventory.updates (Lag: 240k offset difference).', 'Kafka Monitor', 'Confluent Cloud', d3);

    // Audit logs for initial setup
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (id, incidentId, action, actor, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAudit.run('AUD-1', 'INC-20261026-001', 'SYSTEM_SEED', 'Platform Seeder', 'Loaded realistic P1 Payment Gateway post-mortem scenario', now.toString());
    insertAudit.run('AUD-2', 'INC-20261026-002', 'SYSTEM_SEED', 'Platform Seeder', 'Loaded realistic P2 Auth Service Postgres scenario', now.toString());
    insertAudit.run('AUD-3', 'INC-20261026-003', 'SYSTEM_SEED', 'Platform Seeder', 'Loaded active P3 Catalog Search scenario', now.toString());

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
