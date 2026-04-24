"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const simulationEngine_1 = require("../engine/simulationEngine");
const router = (0, express_1.Router)();
// POST /api/simulation/start — Start the simulation
router.post('/start', async (_req, res) => {
    try {
        if (simulationEngine_1.simulationEngine.isRunning()) {
            res.status(400).json({ error: 'Simulation is already running' });
            return;
        }
        await simulationEngine_1.simulationEngine.initialize();
        simulationEngine_1.simulationEngine.start();
        res.json({ message: 'Simulation started', status: simulationEngine_1.simulationEngine.getStatus() });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/simulation/stop — Stop the simulation
router.post('/stop', (_req, res) => {
    try {
        simulationEngine_1.simulationEngine.stop();
        res.json({ message: 'Simulation stopped', status: simulationEngine_1.simulationEngine.getStatus() });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/simulation/reset — Reset everything
router.post('/reset', async (_req, res) => {
    try {
        await simulationEngine_1.simulationEngine.reset();
        res.json({ message: 'Simulation reset', status: simulationEngine_1.simulationEngine.getStatus() });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /api/simulation/status — Get current status
router.get('/status', (_req, res) => {
    res.json(simulationEngine_1.simulationEngine.getStatus());
});
// POST /api/simulation/speed — Set speed multiplier
router.post('/speed', (req, res) => {
    try {
        const { multiplier } = req.body;
        simulationEngine_1.simulationEngine.setSpeed(multiplier || 1);
        res.json({ message: `Speed set to ${multiplier}x`, status: simulationEngine_1.simulationEngine.getStatus() });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/simulation/mode — Set simulation mode
router.post('/mode', (req, res) => {
    try {
        const { mode } = req.body;
        if (mode !== 'MANUAL' && mode !== 'ADAPTIVE') {
            res.status(400).json({ error: 'Mode must be MANUAL or ADAPTIVE' });
            return;
        }
        simulationEngine_1.simulationEngine.setMode(mode);
        res.json({ message: `Mode set to ${mode}`, status: simulationEngine_1.simulationEngine.getStatus() });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/simulation/arrival-rate — Set arrival rate (λ)
router.post('/arrival-rate', (req, res) => {
    try {
        const { lambda } = req.body;
        if (typeof lambda !== 'number' || lambda < 0) {
            res.status(400).json({ error: 'Lambda must be a non-negative number' });
            return;
        }
        simulationEngine_1.simulationEngine.setArrivalRate(lambda);
        res.json({ message: `Arrival rate set to ${lambda}` });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=simulation.routes.js.map