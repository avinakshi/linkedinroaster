import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function main() {
  const orderId = process.argv[2] || 'f4e7c2c5-9ed6-480a-9219-b56263d237bc';
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  const o = await pool.query(
    'SELECT * FROM orders WHERE id=$1',
    [orderId],
  );
  console.log('=== Order ===');
  if (!o.rows[0]) {
    console.log('NOT FOUND');
    await pool.end();
    return;
  }
  const ord = o.rows[0];
  for (const k of Object.keys(ord)) {
    if (k === 'profile_input' || k === 'results') {
      console.log(`  ${k}: <${JSON.stringify(ord[k] || {}).length} chars>`);
    } else {
      const v = ord[k]?.toISOString?.() || ord[k];
      console.log(`  ${k}:`, v);
    }
  }

  console.log('\n=== Recent process-profile jobs ===');
  const j = await pool.query(`
    SELECT id, name, state, retry_count, retry_limit, data, output, created_on, started_on, completed_on
    FROM pgboss.job
    WHERE name = 'process-profile'
    ORDER BY created_on DESC
    LIMIT 8
  `);
  j.rows.forEach(r => {
    const dataPreview = r.data ? JSON.stringify(r.data).slice(0, 100) : 'null';
    const outputPreview = r.output ? JSON.stringify(r.output).slice(0, 200) : '';
    console.log(`  ${r.created_on?.toISOString?.() || r.created_on} | ${r.state} | retries ${r.retry_count}/${r.retry_limit} | data: ${dataPreview} ${outputPreview ? '\n     output: ' + outputPreview : ''}`);
  });

  console.log('\n=== ALL jobs (any name, any state) matching this order ===');
  const matchingJobs = await pool.query(`
    SELECT id, name, state, retry_count, output, created_on, started_on, completed_on
    FROM pgboss.job
    WHERE data::text LIKE $1
    ORDER BY created_on DESC
  `, [`%${orderId}%`]);
  console.log('  Total in pgboss.job table:', matchingJobs.rows.length);
  if (!matchingJobs.rows.length) {
    console.log('  NONE — order is not in the queue');
  } else {
    matchingJobs.rows.forEach(r => {
      console.log(`  ${r.id} | ${r.name} | ${r.state} | created: ${r.created_on?.toISOString?.() || r.created_on}`);
      if (r.output) console.log('     output:', JSON.stringify(r.output));
    });
  }

  console.log('\n=== Jobs in archive (completed/failed/cancelled) ===');
  const archiveCheck = await pool.query("SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema='pgboss' AND table_name='archive'");
  if (archiveCheck.rows[0].cnt > 0) {
    const archived = await pool.query(`
      SELECT id, name, state, output, created_on, completed_on
      FROM pgboss.archive
      WHERE data::text LIKE $1
      ORDER BY created_on DESC
      LIMIT 5
    `, [`%${orderId}%`]);
    console.log('  Archive matches:', archived.rows.length);
    archived.rows.forEach(r => {
      console.log(`  ${r.id} | ${r.name} | ${r.state}`);
      if (r.output) console.log('     output:', JSON.stringify(r.output));
    });
  } else {
    console.log('  (no archive table)');
  }

  console.log('\n=== Job count by state (last 24h) ===');
  const states = await pool.query(`
    SELECT state, COUNT(*)::int AS cnt
    FROM pgboss.job
    WHERE created_on > NOW() - INTERVAL '24 hours'
    GROUP BY state
    ORDER BY cnt DESC
  `);
  states.rows.forEach(r => console.log(`  ${r.state}: ${r.cnt}`));

  await pool.end();
}

main().catch(err => { console.error('inspect failed:', err); process.exit(1); });
