import { Router, Request, Response } from 'express';
import { simulationEngine } from '../engine/simulationEngine';
import { authorize } from '../middleware/auth';

const router = Router();

// POST /api/simulation/start — Start the simulation
router.post('/start', authorize('ADMIN'), async (_req: Request, res: Response) => {
    try {
        if (simulationEngine.isRunning()) {
            res.status(400).json({ error: 'Simulation is already running' });
            return;
        }

        await simulationEngine.initialize();
        simulationEngine.start();
        res.json({ message: 'Simulation started', status: simulationEngine.getStatus() });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/simulation/stop — Stop the simulation
router.post('/stop', authorize('ADMIN'), (_req: Request, res: Response) => {
    try {
        simulationEngine.stop();
        res.json({ message: 'Simulation stopped', status: simulationEngine.getStatus() });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/simulation/reset — Reset everything
router.post('/reset', authorize('ADMIN'), async (_req: Request, res: Response) => {
    try {
        await simulationEngine.reset();
        res.json({ message: 'Simulation reset', status: simulationEngine.getStatus() });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/simulation/status — Get current status
router.get('/status', (_req: Request, res: Response) => {
    res.json(simulationEngine.getStatus());
});

// POST /api/simulation/speed — Set speed multiplier
router.post('/speed', authorize('ADMIN'), (req: Request, res: Response) => {
    try {
        const { multiplier } = req.body;
        simulationEngine.setSpeed(multiplier || 1);
        res.json({ message: `Speed set to ${multiplier}x`, status: simulationEngine.getStatus() });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/simulation/mode — Set simulation mode
router.post('/mode', authorize('ADMIN'), (req: Request, res: Response) => {
    try {
        const { mode } = req.body;
        if (mode !== 'MANUAL' && mode !== 'ADAPTIVE') {
            res.status(400).json({ error: 'Mode must be MANUAL or ADAPTIVE' });
            return;
        }
        simulationEngine.setMode(mode);
        res.json({ message: `Mode set to ${mode}`, status: simulationEngine.getStatus() });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/simulation/arrival-rate — Set arrival rate (λ)
router.post('/arrival-rate', authorize('ADMIN'), (req: Request, res: Response) => {
    try {
        const { lambda } = req.body;
        if (typeof lambda !== 'number' || lambda < 0 || lambda > 100) {
            res.status(400).json({ error: 'Lambda must be a number between 0 and 100' });
            return;
        }
        simulationEngine.setArrivalRate(lambda);
        res.json({ message: `Arrival rate set to ${lambda}` });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/simulation/adaptive-threshold — Set adaptive threshold
router.post('/adaptive-threshold', authorize('ADMIN'), (req: Request, res: Response) => {
    try {
        const { threshold } = req.body;
        if (typeof threshold !== 'number' || threshold < 1 || threshold > 50) {
            res.status(400).json({ error: 'Threshold must be a number between 1 and 50' });
            return;
        }
        simulationEngine.setAdaptiveThreshold(threshold);
        res.json({ message: `Adaptive threshold set to ${threshold}`, status: simulationEngine.getStatus() });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
