"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const envPath = path_1.default.resolve(process.cwd(), '.env');
console.log('🔍 Loading .env from:', envPath);
dotenv_1.default.config({ path: envPath });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const stripe_1 = require("./src/routes/stripe");
const auth_1 = require("./src/routes/auth");
const portal_1 = require("./src/routes/portal");
const admin_1 = __importDefault(require("./src/routes/admin"));
const emailValidator_1 = require("./src/utils/emailValidator");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://10.100.2.215:3000',
    'http://10.100.2.209:3000'
];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/stripe', stripe_1.stripeRoutes);
app.use('/api/portal', portal_1.portalRoutes);
app.use('/api/admin', admin_1.default);
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err.type === 'StripeCardError') {
        return res.status(400).json({ error: err.message });
    }
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
app.listen(PORT, () => {
    console.log(`🚀 LAURx Portal API running on port ${PORT}`);
    console.log(`💳 Stripe configured: ${process.env.STRIPE_SECRET_KEY ? 'Yes' : 'No'}`);
    (0, emailValidator_1.logEmailConfigStatus)();
});
exports.default = app;
//# sourceMappingURL=index.js.map