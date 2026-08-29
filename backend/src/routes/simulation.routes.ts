import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { simulationEngine } from '../engine/simulationEngine';
import { authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../lib/errors';

const router = Router();

const modeSchema = z.object({ mode: z.enum(['MANUAL', 'ADAPTIVE']) });
const speedSchema = z.object({
  multiplier: z
    .number()
    .int()
    .refine((v) => [1, 2, 5, 10].includes(v), 'Invalid multiplier'),
});
const lambdaSchema = z.object({ lambda: z.number().min(0).max(100) });
const thresholdSchema = z.object({ threshold: z.number().int().min(1).max(50) });

export { modeSchema, speedSchema, lambdaSchema, thresholdSchema };

// POST /api/simulation/start — Start the simulation
router.post(
  '/start',
  authorize('ADMIN'),
  asyncHandler(async (_req: Request, res: Response) => {
    if (simulationEngine.isRunning()) {
      res.status(400).json({ error: 'Simulation is already running' });
      return;
    }
    await simulationEngine.initialize();
    simulationEngine.start();
    res.json({ message: 'Simulation started', status: simulationEngine.getStatus() });
  })
);

// POST /api/simulation/stop — Stop the simulation
router.post(
  '/stop',
  authorize('ADMIN'),
  asyncHandler(async (_req: Request, res: Response) => {
    simulationEngine.stop();
    res.json({ message: 'Simulation stopped', status: simulationEngine.getStatus() });
  })
);

// POST /api/simulation/reset — Reset everything
router.post(
  '/reset',
  authorize('ADMIN'),
  asyncHandler(async (_req: Request, res: Response) => {
    await simulationEngine.reset();
    res.json({ message: 'Simulation reset', status: simulationEngine.getStatus() });
  })
);

// GET /api/simulation/status — Get current status
router.get('/status', (_req: Request, res: Response) => {
  res.json(simulationEngine.getStatus());
});

// POST /api/simulation/speed — Set speed multiplier
router.post(
  '/speed',
  authorize('ADMIN'),
  validate({ body: speedSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { multiplier } = req.body as z.infer<typeof speedSchema>;
    simulationEngine.setSpeed(multiplier);
    res.json({ message: `Speed set to ${multiplier}x`, status: simulationEngine.getStatus() });
  })
);

// POST /api/simulation/mode — Set simulation mode
router.post(
  '/mode',
  authorize('ADMIN'),
  validate({ body: modeSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { mode } = req.body as z.infer<typeof modeSchema>;
    simulationEngine.setMode(mode);
    res.json({ message: `Mode set to ${mode}`, status: simulationEngine.getStatus() });
  })
);

// POST /api/simulation/arrival-rate — Set arrival rate (λ)
router.post(
  '/arrival-rate',
  authorize('ADMIN'),
  validate({ body: lambdaSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { lambda } = req.body as z.infer<typeof lambdaSchema>;
    simulationEngine.setArrivalRate(lambda);
    res.json({ message: `Arrival rate set to ${lambda}` });
  })
);

// POST /api/simulation/adaptive-threshold — Set adaptive threshold
router.post(
  '/adaptive-threshold',
  authorize('ADMIN'),
  validate({ body: thresholdSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { threshold } = req.body as z.infer<typeof thresholdSchema>;
    simulationEngine.setAdaptiveThreshold(threshold);
    res.json({
      message: `Adaptive threshold set to ${threshold}`,
      status: simulationEngine.getStatus(),
    });
  })
);

export default router;
