import dotenv from 'dotenv'; dotenv.config();
import { Pool } from 'pg';
import PgBoss from 'pg-boss';

(async () => {
  const url = process.env.DATABASE_URL!;
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

  // List all pgboss tables
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='pgboss' ORDER BY table_name
  `);
  console.log('pgboss tables:', tables.rows.map(r => r.table_name).join(', '));

  // Check for a queue registration table
  const hasQueueTable = tables.rows.some(r => r.table_name === 'queue');
  if (hasQueueTable) {
    const q = await pool.query('SELECT name, policy, retry_limit, retry_delay FROM pgboss.queue ORDER BY name');
    console.log('\nRegistered queues:');
    q.rows.forEach(r => console.log(`  ${r.name} | policy=${r.policy} | retry=${r.retry_limit}/${r.retry_delay}s`));
  }

  // Try to send a test job and see what happens
  console.log('\n=== Test send ===');
  const boss = new PgBoss({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await boss.start();
  console.log('boss started, version:', PgBoss.getConstructionPlans);
  try {
    const jobId = await boss.send('process-profile', { test: true, ts: Date.now() });
    console.log('Test send returned jobId:', jobId);

    // Confirm in DB
    const check = await pool.query(`SELECT id, state, created_on FROM pgboss.job WHERE id=$1`, [jobId]);
    console.log('Job in DB:', check.rows[0]);
  } catch (err: any) {
    console.error('boss.send threw:', err.message);
  }
  await boss.stop({ graceful: true });
  await pool.end();
  process.exit(0);
})();
