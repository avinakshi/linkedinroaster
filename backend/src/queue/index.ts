import PgBoss from 'pg-boss';
import * as Sentry from '@sentry/node';
import { query } from '../db';
import { runPipeline, stage4b_proRewrite } from '../ai/pipeline';

// --- pg-boss instance (shared) ---
export const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// Queue names
const PROFILE_QUEUE = 'process-profile';
const UPGRADE_QUEUE = 'process-upgrade';

// Helper to match BullMQ's queue.add() interface
export const profileQueue = {
  add: async (_name: string, data: any) => {
    await boss.send(PROFILE_QUEUE, data);
  },
};

export const upgradeQueue = {
  add: async (_name: string, data: any) => {
    await boss.send(UPGRADE_QUEUE, data);
  },
};

// Start boss + register workers
export async function startQueueWorkers() {
  await boss.start();

  // pg-boss v10+ requires explicit queue registration before send() will accept jobs.
  // createQueue is idempotent — safe to call on every boot.
  await boss.createQueue(PROFILE_QUEUE);
  await boss.createQueue(UPGRADE_QUEUE);

  // WORKER 1: Process new orders
  await boss.work(PROFILE_QUEUE, async (jobs: PgBoss.Job[]) => {
    for (const job of jobs) {
      const { razorpay_order_id, order_id } = job.data as any;
      let orderId = order_id;
      if (!orderId && razorpay_order_id) {
        const orderResult = await query('SELECT id FROM orders WHERE razorpay_order_id=$1', [razorpay_order_id]);
        if (!orderResult.rows[0]) throw new Error('Order not found: ' + razorpay_order_id);
        orderId = orderResult.rows[0].id;
      }
      if (!orderId) throw new Error('No order_id or razorpay_order_id provided');
      await runPipeline(orderId);
    }
  });

  // WORKER 2: Process upgrades (only Stage 4b — no full pipeline)
  await boss.work(UPGRADE_QUEUE, async (jobs: PgBoss.Job[]) => {
    for (const job of jobs) {
      const { order_id } = job.data as any;
      const orderResult = await query('SELECT * FROM orders WHERE id=$1', [order_id]);
      const o = orderResult.rows[0];
      if (!o) throw new Error('Order not found: ' + order_id);

      const proRewrite = await stage4b_proRewrite(
        o.parsed_profile,
        o.analysis,
        o.job_description,
      );

      await query(
        'UPDATE orders SET rewrite=$1, plan=$2 WHERE id=$3',
        [JSON.stringify(proRewrite), 'pro', order_id],
      );

      console.log(`[STUB] sendResultsEmail for upgraded order ${order_id}`);
    }
  });

  // Error handler
  boss.on('error', (err: Error) => {
    console.error('[pg-boss] error:', err.message);
    Sentry.captureException(err);
  });

  console.log('[pg-boss] Workers started: process-profile, process-upgrade');
}
