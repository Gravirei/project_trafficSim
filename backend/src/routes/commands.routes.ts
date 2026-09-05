import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { auditRunner } from '../engine/auditRunner';
import { EventLogModel, type LogTag } from '../models/eventLog.model';
import { authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../lib/errors';
import type { Command } from '../engine/junctionEngine';

const router = Router();

const idParamSchema = z.object({ id: z.string().min(1).max(32) });

const resetSchema = z.object({}).optional();
const setModeSchema = z.object({ mode: z.enum(['fixed', 'actuated', 'manual']) });
const preemptSchema = z.object({ leg: z.number().int().min(0).max(15) });
const pedCallSchema = z.object({ side: z.number().int().min(0).max(15) });
const forcePhaseSchema = z.object({ phase: z.number().int().min(0).max(15) });
const clientSnapshotSchema = z.object({
  junctionId: z.string().min(1).max(32),
  simT: z.number().min(0).max(1e9),
  phase: z.number().int().min(0).max(15),
  interval: z.enum(['G', 'Y', 'R', 'WALK']),
  queues: z.array(z.number().int().min(0).max(2000)),
  served: z.number().int().min(0).max(1e9),
  waitAvg: z.number().min(0).max(1e6),
  waitMax: z.number().min(0).max(1e6),
  pushedAt: z.number().int().min(0),
});

export {
  idParamSchema,
  setModeSchema,
  preemptSchema,
  pedCallSchema,
  forcePhaseSchema,
  clientSnapshotSchema,
};

/** Log a command to event_log (tag='sys') and return {ok, status}. */
async function logAndAck(
  junctionId: string,
  cmd: string,
  body: unknown,
  res: Response,
  status: Record<string, unknown> = {},
): Promise<void> {
  await EventLogModel.append(
    junctionId,
    auditRunner.getEngines().get(junctionId)?.simT ?? 0,
    'sys',
    `${cmd}: ${JSON.stringify(body)}`,
  );
  res.json({ ok: true, status });
}

function applyOrRespond(
  junctionId: string,
  cmd: Command,
  res: Response,
): boolean {
  const result = auditRunner.applyCommand(junctionId, cmd);
  if (!result.ok) {
    res.status(400).json({ ok: false, reason: result.reason });
    return false;
  }
  return true;
}

// POST /api/commands/:id/reset
router.post(
  '/:id/reset',
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    if (!auditRunner.getEngines().has(id)) {
      res.status(404).json({ ok: false, reason: `junction not found: ${id}` });
      return;
    }
    if (!applyOrRespond(id, { kind: 'reset' }, res)) return;
    await logAndAck(id, 'RESET', req.body ?? {}, res);
  })
);

// POST /api/commands/:id/set-mode
router.post(
  '/:id/set-mode',
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: setModeSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const body = req.body as z.infer<typeof setModeSchema>;
    if (!auditRunner.getEngines().has(id)) {
      res.status(404).json({ ok: false, reason: `junction not found: ${id}` });
      return;
    }
    if (!applyOrRespond(id, { kind: 'setMode', mode: body.mode }, res)) return;
    await logAndAck(id, 'SET_MODE', body, res, { mode: body.mode });
  })
);

// POST /api/commands/:id/preempt
router.post(
  '/:id/preempt',
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: preemptSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const body = req.body as z.infer<typeof preemptSchema>;
    if (!auditRunner.getEngines().has(id)) {
      res.status(404).json({ ok: false, reason: `junction not found: ${id}` });
      return;
    }
    if (!applyOrRespond(id, { kind: 'preempt', leg: body.leg }, res)) return;
    await logAndAck(id, 'PREEMPT', body, res);
  })
);

// POST /api/commands/:id/ped-call
router.post(
  '/:id/ped-call',
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: pedCallSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const body = req.body as z.infer<typeof pedCallSchema>;
    if (!auditRunner.getEngines().has(id)) {
      res.status(404).json({ ok: false, reason: `junction not found: ${id}` });
      return;
    }
    if (!applyOrRespond(id, { kind: 'pedCall', side: body.side }, res)) return;
    await logAndAck(id, 'PED_CALL', body, res);
  })
);

// POST /api/commands/:id/force-phase
router.post(
  '/:id/force-phase',
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: forcePhaseSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const body = req.body as z.infer<typeof forcePhaseSchema>;
    if (!auditRunner.getEngines().has(id)) {
      res.status(404).json({ ok: false, reason: `junction not found: ${id}` });
      return;
    }
    if (!applyOrRespond(id, { kind: 'forcePhase', phase: body.phase }, res)) return;
    await logAndAck(id, 'FORCE_PHASE', body, res);
  })
);

// POST /api/commands/:id/snapshot — client pushes its current snapshot
// (used by the frontend audit sync, see frontend/src/lib/sim/audit.ts).
// We do NOT require ADMIN here — any authenticated client may push.
router.post(
  '/:id/snapshot',
  validate({ params: idParamSchema, body: clientSnapshotSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as z.infer<typeof idParamSchema>;
    const body = req.body as z.infer<typeof clientSnapshotSchema>;
    if (body.junctionId !== id) {
      res.status(400).json({ ok: false, reason: 'junctionId mismatch' });
      return;
    }
    if (!auditRunner.getEngines().has(id)) {
      res.status(404).json({ ok: false, reason: `junction not found: ${id}` });
      return;
    }
    auditRunner.pushClientSnapshot(body);
    res.json({ ok: true });
  })
);

export default router;
