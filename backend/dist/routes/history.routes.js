"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const queueHistory_model_1 = require("../models/queueHistory.model");
const router = (0, express_1.Router)();
// GET /api/history — Fetch historical queue data
router.get('/', async (req, res) => {
    try {
        const signalId = req.query.signal_id ? parseInt(req.query.signal_id) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        let history;
        if (signalId) {
            history = await queueHistory_model_1.QueueHistoryModel.getBySignalId(signalId, limit);
        }
        else {
            history = await queueHistory_model_1.QueueHistoryModel.getAll(limit);
        }
        res.json(history);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=history.routes.js.map