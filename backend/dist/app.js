"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const signals_routes_1 = __importDefault(require("./routes/signals.routes"));
const simulation_routes_1 = __importDefault(require("./routes/simulation.routes"));
const history_routes_1 = __importDefault(require("./routes/history.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express_1.default.json());
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/signals', signals_routes_1.default);
app.use('/api/simulation', simulation_routes_1.default);
app.use('/api/history', history_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
// Global error handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map