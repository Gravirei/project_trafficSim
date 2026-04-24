"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const queueHistory_model_1 = require("../models/queueHistory.model");
const router = (0, express_1.Router)();
// GET /api/analytics/summary — Fetch aggregated system metrics
router.get('/summary', async (_req, res) => {
    try {
        const summary = await queueHistory_model_1.QueueHistoryModel.getAggregatedSummary();
        res.json({
            systemAvgWait: Number(summary.system_avg_wait) || 0,
            peakQueueLength: Number(summary.peak_queue_length) || 0,
            avgUtilization: Number(summary.avg_utilization) || 0,
            totalRecords: Number(summary.total_records) || 0
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map