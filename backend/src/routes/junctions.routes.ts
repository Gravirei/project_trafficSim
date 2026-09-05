import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { JunctionModel } from '../models/junction.model';
import { PhaseDurationModel, type DurationKey } from '../models/phaseDuration.model';
import { auditRunner } from '../engine/auditRunner';
import { authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../lib/errors';

const router = Router();

const idParamSchema = z.object({ id: z.string().min(1).max(32) });

const durationPatchSchema = z.object({
  thru: z.number().min(1).max(120).optional(),
  left: z.number().min(1).max(120).optional(),
  yellow: z.number().min(1).max(20).optional(),
  allred: z.number().min(0).max(10).optional(),
});

export { idParamSchema, durationPatchSchema };

// GET /api/junctions — list all junction definitions
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const junctions = await JunctionModel.getAll();
    res.json({ data: junctions });
  })
);

// GET /api/junctions/:id — single junction
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const J = await JunctionModel.getById(id);
    if (!J) {
      res.status(404).json({ error: `junction not found: ${id}` });
      return;
    }
    res.json({ data: J });
  })
);

// PUT /api/junctions/:id/durations — update phase_durations
router.put(
  '/:id/durations',
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: durationPatchSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const J = await JunctionModel.getById(id);
    if (!J) {
      res.status(404).json({ error: `junction not found: ${id}` });
      return;
    }
    const patch = req.body as z.infer<typeof durationPatchSchema>;
    // Filter to keys the model knows about, with proper types.
    const dbPatch: Partial<Record<DurationKey, number>> = {};
    for (const key of ['thru', 'left', 'yellow', 'allred'] as const) {
      if (patch[key] !== undefined) dbPatch[key] = patch[key];
    }
    const updated = await PhaseDurationModel.update(id, dbPatch);
    if (!updated) {
      res.status(500).json({ error: 'failed to update durations' });
      return;
    }
    // Propagate to the live engine.
    auditRunner.setDurations(id, patch);
    res.json({ data: updated });
  })
);

// GET /api/junctions/:id/snapshot — latest EngineSnapshot
router.get(
  '/:id/snapshot',
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

export default router;
