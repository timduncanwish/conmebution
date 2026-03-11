"use strict";
/**
 * API Routes Index
 * Combines all API route modules
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const generation_routes_1 = __importDefault(require("./generation.routes"));
const media_routes_1 = __importDefault(require("./media.routes"));
const router = (0, express_1.Router)();
/**
 * GET /api/health
 * API health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'conmebution-api',
            version: '1.0.0',
        },
    });
});
/**
 * Mount generation routes
 */
router.use('/generate', generation_routes_1.default);
/**
 * Mount media generation routes
 */
router.use('/generate', media_routes_1.default);
/**
 * Mount task status routes
 */
router.use('/tasks', generation_routes_1.default);
exports.apiRouter = router;
