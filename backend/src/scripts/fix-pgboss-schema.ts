/**
 * One-shot remediation: drops the `pgboss` schema and re-runs pg-boss start()
 * so the schema regenerates at the version pg-boss 10.x expects.
 *
 * Symptom this fixes:
 *   POST /api/redeem-code error: column "expire_in" of relation "job" does not exist
 *
 * Run on Railway: `railway run node dist/scripts/fix-pgboss-schema.js`
 * (or via npm script)
 */
import dotenv from 'dotenv';
import PgBoss from 'pg-boss';
import { Pool } from 'pg';

dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

  console.log('Inspecting pgboss schema...');
  const before = await pool.query(`
    SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'pgboss') AS schema_exists
  `);
  console.log('pgboss schema exists:', before.rows[0].schema_exists);

  if (before.rows[0].schema_exists) {
    const cols = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'pgboss' AND table_name = 'job'
      ORDER BY ordinal_position
    `);
    console.log('pgboss.job columns BEFORE:', cols.rows.map(r => r.column_name).join(', '));

    console.log('Dropping pgboss schema (cascade)...');
    await pool.query('DROP SCHEMA IF EXISTS pgboss CASCADE');
    console.log('Dropped.');
  }

  await pool.end();

  console.log('Starting pg-boss to recreate fresh schema...');
  const boss = new PgBoss({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await boss.start();
  console.log('pg-boss started, schema recreated.');

  // Sanity-check
  const pool2 = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  const cols = await pool2.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'pgboss' AND table_name = 'job'
    ORDER BY ordinal_position
  `);
  console.log('pgboss.job columns AFTER:', cols.rows.map(r => r.column_name).join(', '));
  const hasExpireIn = cols.rows.some(r => r.column_name === 'expire_in');
  console.log('expire_in present:', hasExpireIn);

  await pool2.end();
  await boss.stop({ graceful: true });

  if (!hasExpireIn) {
    console.error('FAIL: expire_in column still missing');
    process.exit(1);
  }
  console.log('OK — schema is healthy.');
  process.exit(0);
}

main().catch(err => {
  console.error('fix-pgboss-schema failed:', err);
  process.exit(1);
});
