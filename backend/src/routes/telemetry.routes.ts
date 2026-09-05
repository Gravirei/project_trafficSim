import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { auditRunner } from '../engine/auditRunner';
import { EventLogModel } from '../models/eventLog.model';
import { authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../lib/errors';

const router = Router();

const idParamSchema = z.object({ id: z.string().min(1).max(32) });
const eventsQuerySchema = z.object({
  sinceMs: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(500).default(70),
});

export { idParamSchema, eventsQuerySchema };

// GET /api/telemetry/junctions — list of all junctions with current snapshot
router.get(
  '/junctions',
  asyncHandler(async (_req: Request, res: Response) => {
    const data: Array<{
      id: string;
      phase: number;
      interval: string;
      simT: number;
      preempt: unknown;
    }> = [];
    for (const [id, engine] of auditRunner.getEngines()) {
      const s = engine.snapshot();
      data.push({
        id,
        phase: s.phase,
        interval: s.interval,
        simT: s.simT,
        preempt: s.preempt,
      });
    }
    res.json({ data });
  })
);

// GET /api/telemetry/junction/:id — full snapshot
router.get(
  '/junction/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const engine = auditRunner.getEngines().get(id);
    if (!engine) {
      res.status(404).json({ error: `junction not found: ${id}` });
      return;
    }
    res.json({ data: engine.snapshot() });
  })
);

// GET /api/telemetry/junction/:id/events?sinceMs=&limit=
router.get(
  '/junction/:id/events',
  validate({ params: idParamSchema, query: eventsQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const { sinceMs, limit } = req.query as unknown as z.infer<typeof eventsQuerySchema>;
    if (!auditRunner.getEngines().has(id)) {
      res.status(404).json({ error: `junction not found: ${id}` });
      return;
    }
    const events = await EventLogModel.getSince(id, sinceMs, limit);
    res.json({ data: events });
  })
);

// GET /api/telemetry/junction/:id/drifts — recent drift entries
// (auth-required: only operators should see audit discrepancies)
router.get(
  '/junction/:id/drifts',
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    if (!auditRunner.getEngines().has(id)) {
      res.status(404).json({ error: `junction not found: ${id}` });
      return;
    }
    res.json({ data: auditRunner.getDrifts(id) });
  })
);

// GET /api/telemetry/junction/:id/spark?windowSec=90
// Audit runner doesn't yet model per-second queue/served history. For now,
// return the served count history from event_log (PHASE entries imply a
// served phase boundary). The frontend builds sparklines locally; this
// endpoint exists for cold reload backfill per Phase 7.
router.get(
  '/junction/:id/spark',
  validate({ params: idParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    if (!auditRunner.getEngines().has(id)) {
      res.status(404).json({ error: `junction not found: ${id}` });
      return;
    }
    const events = await EventLogModel.getRecent(id, 200);
    // Reverse to oldest-first and turn PHASE log entries into spark points.
    const points: Array<{ t: number; v: number }> = [];
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (e.tag === 'phase') points.push({ t: e.t, v: e.t });
    }
    res.json({ data: points });
  })
);

export default router;
