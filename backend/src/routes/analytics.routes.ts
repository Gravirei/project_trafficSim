import { Router, Request, Response } from 'express';
import { QueueHistoryModel } from '../models/queueHistory.model';
import { asyncHandler } from '../lib/errors';

const router = Router();

// GET /api/analytics/summary — Fetch aggregated system metrics
router.get(
  '/summary',
  asyncHandler(async (_req: Request, res: Response) => {
    const summary = await QueueHistoryModel.getAggregatedSummary();
    res.json({
      systemAvgWait: Number(summary.system_avg_wait) || 0,
      peakQueueLength: Number(summary.peak_queue_length) || 0,
      avgUtilization: Number(summary.avg_utilization) || 0,
      totalRecords: Number(summary.total_records) || 0,
    });
  })
);

export default router;
