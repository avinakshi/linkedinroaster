/**
 * Requeue any orders that are stuck in `processing_status='queued'` but
 * have no live pg-boss job (because we just dropped + recreated the schema).
 */
import dotenv from 'dotenv';
import { Pool } from 'pg';
import PgBoss from 'pg-boss';

dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

  // Orders stuck "queued" but in fact orphaned by the schema reset
  const result = await pool.query(`
    SELECT id, email, plan, payment_status, processing_status, created_at
    FROM orders
    WHERE processing_status = 'queued'
      AND payment_status = 'paid'
      AND created_at > NOW() - INTERVAL '7 days'
    ORDER BY created_at ASC
  `);

  console.log(`Found ${result.rows.length} stuck order(s):`);
  result.rows.forEach(r => console.log(`  - ${r.id} (${r.email}, ${r.plan}, ${r.created_at.toISOString()})`));

  if (!result.rows.length) {
    console.log('Nothing to requeue.');
    await pool.end();
    process.exit(0);
  }

  const boss = new PgBoss({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await boss.start();

  for (const row of result.rows) {
    await boss.send('process-profile', { order_id: row.id });
    console.log(`  ✓ Requeued ${row.id}`);
  }

  await boss.stop({ graceful: true });
  await pool.end();
  console.log('Done.');
  process.exit(0);
}

main().catch(err => {
  console.error('requeue-pending failed:', err);
  process.exit(1);
});
