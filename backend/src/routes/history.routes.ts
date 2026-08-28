import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { QueueHistoryModel } from '../models/queueHistory.model';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../lib/errors';

const router = Router();

const historyQuerySchema = z.object({
  signal_id: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
  page: z.coerce.number().int().min(1).optional().default(1),
});

// GET /api/history — Fetch historical queue data
router.get(
  '/',
  validate({ query: historyQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { signal_id, limit } = req.query as unknown as z.infer<typeof historyQuerySchema>;

    const history = signal_id
      ? await QueueHistoryModel.getBySignalId(Number(signal_id), Number(limit))
      : await QueueHistoryModel.getAll(Number(limit));

    res.json({ data: history, meta: { limit: Number(limit), count: history.length } });
  })
);

export default router;
