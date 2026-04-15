import * as Sentry from '@sentry/node';
import { query } from '../db';
import { runBuildPipeline } from '../ai/build-pipeline';
import { boss } from './index';

const BUILD_QUEUE = 'process-build';

// Helper to match BullMQ's queue.add() interface
export const buildQueue = {
  add: async (_name: string, data: any) => {
    await boss.send(BUILD_QUEUE, data);
  },
};

// Register build worker (called after boss.start() in queue/index.ts)
export async function startBuildWorker() {
  await boss.work(BUILD_QUEUE, { localConcurrency: 4 }, async (job: any) => {
    const { razorpay_order_id, order_id } = job.data as any;
    let orderId = order_id;
    if (!orderId && razorpay_order_id) {
      const orderResult = await query('SELECT id FROM build_orders WHERE razorpay_order_id=$1', [razorpay_order_id]);
      if (!orderResult.rows[0]) throw new Error('Build order not found: ' + razorpay_order_id);
      orderId = orderResult.rows[0].id;
    }
    if (!orderId) throw new Error('No order_id or razorpay_order_id provided');
    await runBuildPipeline(orderId);
  });

  console.log('[pg-boss] Worker started: process-build');
}
