import { Router, Request, Response } from 'express';
import { QueueHistoryModel } from '../models/queueHistory.model';

const router = Router();

// GET /api/history — Fetch historical queue data
router.get('/', async (req: Request, res: Response) => {
    try {
        const signalId = req.query.signal_id ? parseInt(req.query.signal_id as string) : null;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

        let history;
        if (signalId) {
            history = await QueueHistoryModel.getBySignalId(signalId, limit);
        } else {
            history = await QueueHistoryModel.getAll(limit);
        }

        res.json(history);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
