import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SignalModel } from '../models/signal.model';
import { QueueHistoryModel } from '../models/queueHistory.model';
import { authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../lib/errors';

const router = Router();

const createSignalSchema = z.object({
  name: z.string().min(1).max(100),
  green_duration: z.number().int().min(1).max(300).optional().default(30),
  red_duration: z.number().int().min(1).max(300).optional().default(30),
  yellow_duration: z.number().int().min(1).max(300).optional().default(5),
});

const updateSignalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  green_duration: z.number().int().min(1).max(300).optional(),
  red_duration: z.number().int().min(1).max(300).optional(),
  yellow_duration: z.number().int().min(1).max(300).optional(),
});

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export { createSignalSchema, updateSignalSchema, idParamSchema };

// GET /api/signals — List all signals
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const signals = await SignalModel.getAll();
    res.json({ data: signals });
  })
);

// POST /api/signals — Create a new signal
router.post(
  '/',
  authorize('ADMIN'),
  validate({ body: createSignalSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, green_duration, red_duration, yellow_duration } = req.body as z.infer<
      typeof createSignalSchema
    >;
    const signal = await SignalModel.create(name, green_duration, red_duration, yellow_duration);
    res.status(201).json(signal);
  })
);

// PUT /api/signals/:id — Update signal configuration
router.put(
  '/:id',
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: updateSignalSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as { id: number };
    const signal = await SignalModel.update(Number(id), req.body);

    if (!signal) {
      res.status(404).json({ error: 'Signal not found' });
      return;
    }

    res.json(signal);
  })
);

// GET /api/signals/:id/stats — Get current metrics for a signal
router.get(
  '/:id/stats',
  validate({ params: idParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number((req.params as unknown as { id: number }).id);
    const signal = await SignalModel.getById(id);

    if (!signal) {
      res.status(404).json({ error: 'Signal not found' });
      return;
    }

    const history = await QueueHistoryModel.getBySignalId(id, 1);

    const stats =
      history.length > 0
        ? {
            signalId: id,
            name: signal.name,
            state: signal.current_state,
            queueLength: history[0].queue_length,
            avgWaitTime: history[0].avg_wait_time,
            utilization: history[0].utilization,
            arrivalRate: history[0].arrival_rate,
          }
        : {
            signalId: id,
            name: signal.name,
            state: signal.current_state,
            queueLength: 0,
            avgWaitTime: 0,
            utilization: 0,
            arrivalRate: 0,
          };

    res.json(stats);
  })
);

// DELETE /api/signals/:id — Delete a signal
router.delete(
  '/:id',
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number((req.params as unknown as { id: number }).id);
    const deleted = await SignalModel.delete(id);

    if (!deleted) {
      res.status(404).json({ error: 'Signal not found' });
      return;
    }

    res.json({ message: 'Signal deleted' });
  })
);

export default router;
