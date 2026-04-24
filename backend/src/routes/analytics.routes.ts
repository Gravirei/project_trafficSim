import { Router, Request, Response } from 'express';
import { QueueHistoryModel } from '../models/queueHistory.model';

const router = Router();

// GET /api/analytics/summary — Fetch aggregated system metrics
router.get('/summary', async (_req: Request, res: Response) => {
    try {
        const summary = await QueueHistoryModel.getAggregatedSummary();
        res.json({
            systemAvgWait: Number(summary.system_avg_wait) || 0,
            peakQueueLength: Number(summary.peak_queue_length) || 0,
            avgUtilization: Number(summary.avg_utilization) || 0,
            totalRecords: Number(summary.total_records) || 0
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
