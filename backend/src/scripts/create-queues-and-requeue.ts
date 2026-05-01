/**
 * One-shot: register the named queues that pg-boss v10 requires explicitly,
 * then re-send any orders that are sitting in processing_status='queued' but
 * have no job in pgboss.job (because they were silently dropped before the fix).
 */
import dotenv from 'dotenv'; dotenv.config();
import { Pool } from 'pg';
import PgBoss from 'pg-boss';

(async () => {
  const url = process.env.DATABASE_URL!;
  const boss = new PgBoss({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await boss.start();

  console.log('Creating queues (idempotent)...');
  for (const q of ['process-profile', 'process-upgrade', 'process-build']) {
    await boss.createQueue(q);
    console.log(`  ✓ ${q}`);
  }

  // Verify
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  const queues = await pool.query('SELECT name FROM pgboss.queue ORDER BY name');
  console.log('Registered queues:', queues.rows.map(r => r.name).join(', '));

  // Find stuck orders
  const stuck = await pool.query(`
    SELECT id, email, plan, created_at
    FROM orders
    WHERE processing_status='queued'
      AND payment_status='paid'
      AND created_at > NOW() - INTERVAL '7 days'
    ORDER BY created_at ASC
  `);
  console.log(`\nFound ${stuck.rows.length} stuck order(s):`);
  for (const row of stuck.rows) {
    console.log(`  - ${row.id} (${row.email}, ${row.plan}, ${row.created_at.toISOString()})`);
  }

  if (stuck.rows.length) {
    console.log('\nRequeueing...');
    for (const row of stuck.rows) {
      const jobId = await boss.send('process-profile', { order_id: row.id });
      console.log(`  ${row.id} → job ${jobId || 'NULL (still failing!)'}`);
    }
  }

  // Same for build orders
  const buildStuck = await pool.query(`
    SELECT id, email, created_at FROM build_orders
    WHERE processing_status='queued' AND payment_status='paid'
      AND created_at > NOW() - INTERVAL '7 days'
    ORDER BY created_at ASC
  `).catch(() => ({ rows: [] }));
  if (buildStuck.rows.length) {
    console.log(`\n${buildStuck.rows.length} stuck build order(s) — requeueing:`);
    for (const row of buildStuck.rows) {
      const jobId = await boss.send('process-build', { order_id: row.id });
      console.log(`  ${row.id} → job ${jobId || 'NULL'}`);
    }
  }

  await boss.stop({ graceful: true });
  await pool.end();
  console.log('Done.');
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
