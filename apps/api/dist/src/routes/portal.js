"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalRoutes = void 0;
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../utils/auth");
const router = express_1.default.Router();
exports.portalRoutes = router;
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!(0, auth_1.validateJWTPayload)(decoded)) {
            return res.status(401).json({ error: 'Invalid token payload' });
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const dashboardData = {
            user: {
                email: userEmail,
                name: userEmail.split('@')[0],
                joinDate: new Date().toISOString(),
                preferences: {
                    emailNotifications: true,
                    smsNotifications: false,
                    marketingEmails: true
                }
            },
            stats: {
                totalOrders: 0,
                activeSubscriptions: 0,
                totalSaved: 0,
                nextDelivery: null
            },
            recentActivity: [],
            quickActions: [
                {
                    id: 'manage-subscription',
                    title: 'Manage Subscriptions',
                    description: 'View and modify your LAURx subscriptions',
                    icon: 'subscription',
                    url: '/subscriptions'
                },
                {
                    id: 'payment-methods',
                    title: 'Payment Methods',
                    description: 'Update your payment information',
                    icon: 'payment',
                    url: '/payment-methods'
                },
                {
                    id: 'order-history',
                    title: 'Order History',
                    description: 'View past orders and invoices',
                    icon: 'history',
                    url: '/orders'
                },
                {
                    id: 'support',
                    title: 'Get Support',
                    description: 'Contact our customer support team',
                    icon: 'support',
                    url: '/support'
                }
            ]
        };
        res.json(dashboardData);
    }
    catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});
router.put('/preferences', authenticateToken, async (req, res) => {
    try {
        const { preferences } = req.body;
        const userEmail = req.user.email;
        const validPreferences = {
            emailNotifications: Boolean(preferences?.emailNotifications),
            smsNotifications: Boolean(preferences?.smsNotifications),
            marketingEmails: Boolean(preferences?.marketingEmails)
        };
        console.log(`Updated preferences for ${userEmail}:`, validPreferences);
        res.json({
            message: 'Preferences updated successfully',
            preferences: validPreferences
        });
    }
    catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});
router.get('/support/tickets', authenticateToken, async (req, res) => {
    try {
        const tickets = [
            {
                id: 'ticket-001',
                subject: 'Question about LAURx dosage',
                status: 'open',
                priority: 'medium',
                created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                lastUpdate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                messages: 2
            }
        ];
        res.json({ tickets });
    }
    catch (error) {
        console.error('Error fetching support tickets:', error);
        res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
});
router.post('/support/tickets', authenticateToken, async (req, res) => {
    try {
        const { subject, message, priority = 'medium' } = req.body;
        const userEmail = req.user.email;
        if (!subject || !message) {
            return res.status(400).json({ error: 'Subject and message are required' });
        }
        const ticket = {
            id: `ticket-${Date.now()}`,
            subject,
            message,
            priority,
            status: 'open',
            userEmail,
            created: new Date().toISOString()
        };
        console.log('New support ticket created:', ticket);
        res.status(201).json({
            message: 'Support ticket created successfully',
            ticket: {
                id: ticket.id,
                subject: ticket.subject,
                status: ticket.status,
                created: ticket.created
            }
        });
    }
    catch (error) {
        console.error('Error creating support ticket:', error);
        res.status(500).json({ error: 'Failed to create support ticket' });
    }
});
router.get('/products', async (req, res) => {
    try {
        const products = [
            {
                id: 'laurx-immune-support',
                name: 'LAURx Immune Support',
                description: 'A daily formula for immune defense. Support it consistently, and your body is better equipped to fend off what\'s going around—and bounce back faster when it counts.',
                price: {
                    oneTime: 6295,
                    subscription: 5351
                },
                currency: 'usd',
                images: [
                    '/images/laurx-bottle.jpg'
                ],
                features: [
                    'Daily immune support',
                    'Early symptom relief',
                    'Faster recovery',
                    'Natural ingredients',
                    'NDC 82532-058-01'
                ],
                subscriptionOptions: [
                    {
                        interval: 'month',
                        intervalCount: 1,
                        discount: 15,
                        description: 'Save 15% with monthly delivery'
                    }
                ],
                inStock: true,
                freeShippingThreshold: 10000
            }
        ];
        res.json({ products });
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'LAURx Portal API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
//# sourceMappingURL=portal.js.map