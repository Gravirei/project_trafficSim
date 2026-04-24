import { Router, Request, Response } from 'express';
import { SignalModel } from '../models/signal.model';
import { authorize } from '../middleware/auth';

const router = Router();

// GET /api/signals — List all signals
router.get('/', async (_req: Request, res: Response) => {
    try {
        const signals = await SignalModel.getAll();
        res.json(signals);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/signals — Create a new signal
router.post('/', authorize('ADMIN'), async (req: Request, res: Response) => {
    try {
        const { name, green_duration, red_duration, yellow_duration } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }

        const durationFields: Record<string, unknown> = { green_duration, red_duration, yellow_duration };
        for (const [field, val] of Object.entries(durationFields)) {
            if (val !== undefined) {
                if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 300) {
                    res.status(400).json({ error: `${field} must be a positive integer between 1 and 300` });
                    return;
                }
            }
        }

        const signal = await SignalModel.create(
            name,
            green_duration || 30,
            red_duration || 30,
            yellow_duration || 5
        );
        res.status(201).json(signal);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/signals/:id — Update signal configuration
router.put('/:id', authorize('ADMIN'), async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const { name, green_duration, red_duration, yellow_duration } = req.body;

        const durationFields: Record<string, unknown> = { green_duration, red_duration, yellow_duration };
        for (const [field, val] of Object.entries(durationFields)) {
            if (val !== undefined) {
                if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 300) {
                    res.status(400).json({ error: `${field} must be a positive integer between 1 and 300` });
                    return;
                }
            }
        }

        const signal = await SignalModel.update(id, {
            name,
            green_duration,
            red_duration,
            yellow_duration,
        });

        if (!signal) {
            res.status(404).json({ error: 'Signal not found' });
            return;
        }

        res.json(signal);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/signals/:id/stats — Get current metrics for a signal
router.get('/:id/stats', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const signal = await SignalModel.getById(id);

        if (!signal) {
            res.status(404).json({ error: 'Signal not found' });
            return;
        }

        // Get the latest queue history entry for this signal
        const { QueueHistoryModel } = await import('../models/queueHistory.model');
        const history = await QueueHistoryModel.getBySignalId(id, 1);

        const stats = history.length > 0
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
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/signals/:id — Delete a signal
router.delete('/:id', authorize('ADMIN'), async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const deleted = await SignalModel.delete(id);

        if (!deleted) {
            res.status(404).json({ error: 'Signal not found' });
            return;
        }

        res.json({ message: 'Signal deleted' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
