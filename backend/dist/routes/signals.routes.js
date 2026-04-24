"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const signal_model_1 = require("../models/signal.model");
const router = (0, express_1.Router)();
// GET /api/signals — List all signals
router.get('/', async (_req, res) => {
    try {
        const signals = await signal_model_1.SignalModel.getAll();
        res.json(signals);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/signals — Create a new signal
router.post('/', async (req, res) => {
    try {
        const { name, green_duration, red_duration, yellow_duration } = req.body;
        if (!name) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }
        const signal = await signal_model_1.SignalModel.create(name, green_duration || 30, red_duration || 30, yellow_duration || 5);
        res.status(201).json(signal);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// PUT /api/signals/:id — Update signal configuration
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, green_duration, red_duration, yellow_duration } = req.body;
        const signal = await signal_model_1.SignalModel.update(id, {
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /api/signals/:id/stats — Get current metrics for a signal
router.get('/:id/stats', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const signal = await signal_model_1.SignalModel.getById(id);
        if (!signal) {
            res.status(404).json({ error: 'Signal not found' });
            return;
        }
        // Get the latest queue history entry for this signal
        const { QueueHistoryModel } = await Promise.resolve().then(() => __importStar(require('../models/queueHistory.model')));
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// DELETE /api/signals/:id — Delete a signal
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await signal_model_1.SignalModel.delete(id);
        if (!deleted) {
            res.status(404).json({ error: 'Signal not found' });
            return;
        }
        res.json({ message: 'Signal deleted' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=signals.routes.js.map