"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const emailService_1 = require("../services/emailService");
const stripe_1 = __importDefault(require("stripe"));
const emailValidator_1 = require("../utils/emailValidator");
const router = express_1.default.Router();
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('ERROR: STRIPE_SECRET_KEY is not set in environment variables!');
}
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', { apiVersion: '2023-10-16' });
const ADMIN_USERS = [
    {
        id: 'admin-1',
        email: 'mglynn@mylaurelrose.com',
        name: 'Admin User',
        role: 'super_admin',
        permissions: ['all']
    },
    {
        id: 'admin-2',
        email: 'ajgregware4290@gmail.com',
        name: 'Admin User',
        role: 'super_admin',
        permissions: ['all']
    }
];
const verificationCodes = new Map();
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const adminUser = ADMIN_USERS.find(user => user.id === decoded.userId);
        if (!adminUser) {
            return res.status(401).json({ message: 'Invalid admin user' });
        }
        req.adminUser = adminUser;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
router.post('/auth/request-code', async (req, res) => {
    try {
        const { email } = req.body;
        const adminUser = ADMIN_USERS.find(user => user.email === email);
        if (!adminUser) {
            return res.status(403).json({ message: 'Unauthorized email address' });
        }
        const code = generateCode();
        const expires = Date.now() + 10 * 60 * 1000;
        verificationCodes.set(email, { code, expires });
        await (0, emailService_1.sendEmail)({
            to: email,
            subject: 'LAURx Admin Portal - Verification Code',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">LAURx Admin Portal</h2>
          <p>Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
        });
        res.json({ message: 'Verification code sent' });
    }
    catch (error) {
        console.error('Error sending admin verification code:', error);
        res.status(500).json({ message: 'Failed to send verification code' });
    }
});
router.post('/auth/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;
        const storedData = verificationCodes.get(email);
        if (!storedData) {
            return res.status(400).json({ message: 'No verification code found' });
        }
        if (Date.now() > storedData.expires) {
            verificationCodes.delete(email);
            return res.status(400).json({ message: 'Verification code expired' });
        }
        if (storedData.code !== code) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
        verificationCodes.delete(email);
        const adminUser = ADMIN_USERS.find(user => user.email === email);
        if (!adminUser) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: adminUser.id, email: adminUser.email, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: adminUser.id,
                email: adminUser.email,
                name: adminUser.name,
                role: adminUser.role,
                permissions: adminUser.permissions
            }
        });
    }
    catch (error) {
        console.error('Error verifying admin code:', error);
        res.status(500).json({ message: 'Login failed' });
    }
});
router.get('/debug/config', authenticateAdmin, async (req, res) => {
    try {
        res.json({
            stripeKeySet: !!process.env.STRIPE_SECRET_KEY,
            stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'NOT_SET',
            jwtSecretSet: !!process.env.JWT_SECRET,
            emailConfigured: !!process.env.SMTP_USER,
            nodeEnv: process.env.NODE_ENV
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get config' });
    }
});
router.get('/customers', authenticateAdmin, async (req, res) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({ message: 'Stripe API key not configured' });
        }
        const customers = await stripe.customers.list({ limit: 100 });
        const customersWithSubscriptions = await Promise.all(customers.data.map(async (customer) => {
            const subscriptions = await stripe.subscriptions.list({
                customer: customer.id,
                limit: 10
            });
            const invoices = await stripe.invoices.list({
                customer: customer.id,
                limit: 5
            });
            const totalSpent = invoices.data.reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0) / 100;
            return {
                id: customer.id,
                email: customer.email,
                name: customer.name || customer.email,
                subscriptions: subscriptions.data.map(sub => ({
                    id: sub.id,
                    status: sub.status,
                    currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
                    product: sub.items.data[0]?.price?.nickname || 'Unknown',
                    price: (sub.items.data[0]?.price?.unit_amount || 0) / 100,
                    interval: sub.items.data[0]?.price?.recurring?.interval || 'month'
                })),
                totalSpent,
                createdAt: new Date(customer.created * 1000).toISOString(),
                lastOrderDate: invoices.data[0] ? new Date(invoices.data[0].created * 1000).toISOString() : undefined,
                status: subscriptions.data.some(sub => sub.status === 'active') ? 'active' :
                    subscriptions.data.length > 0 ? 'inactive' : 'churned'
            };
        }));
        res.json({ customers: customersWithSubscriptions });
    }
    catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Failed to fetch customers' });
    }
});
router.get('/analytics', authenticateAdmin, async (req, res) => {
    try {
        const customers = await stripe.customers.list({ limit: 100 });
        const subscriptions = await stripe.subscriptions.list({ limit: 100 });
        const invoices = await stripe.invoices.list({ limit: 100 });
        const activeSubscriptions = subscriptions.data.filter(sub => sub.status === 'active').length;
        const totalCustomers = customers.data.length;
        const currentMonth = new Date();
        currentMonth.setDate(1);
        const monthlyInvoices = invoices.data.filter(invoice => new Date(invoice.created * 1000) >= currentMonth);
        const monthlyRevenue = monthlyInvoices.reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0) / 100;
        const cancelledSubs = subscriptions.data.filter(sub => sub.status === 'canceled').length;
        const churnRate = totalCustomers > 0 ? (cancelledSubs / totalCustomers) * 100 : 0;
        const analytics = {
            totalCustomers,
            activeSubscriptions,
            monthlyRevenue,
            churnRate,
            emailStats: {
                campaignsSent: 12,
                averageOpenRate: 24.5,
                averageClickRate: 3.2
            },
            recentActivity: [
                {
                    id: '1',
                    type: 'subscription_created',
                    description: 'New subscription created',
                    timestamp: new Date().toISOString()
                },
                {
                    id: '2',
                    type: 'email_sent',
                    description: 'Renewal reminder sent to 15 customers',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                }
            ]
        };
        res.json({ analytics });
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
});
router.post('/email-campaigns', authenticateAdmin, async (req, res) => {
    try {
        const { name, subject, content, type, recipients } = req.body;
        let customerEmails = [];
        if (recipients === 'all') {
            const customers = await stripe.customers.list({ limit: 100 });
            customerEmails = customers.data.map(c => c.email).filter(Boolean);
        }
        else if (recipients === 'active_subscribers') {
            const subscriptions = await stripe.subscriptions.list({
                status: 'active',
                limit: 100
            });
            const customerIds = subscriptions.data.map(sub => sub.customer);
            const customers = await Promise.all(customerIds.map(id => stripe.customers.retrieve(id)));
            customerEmails = customers
                .map(c => typeof c !== 'string' && !c.deleted && 'email' in c ? c.email : null)
                .filter(Boolean);
        }
        const emailPromises = customerEmails.map(email => (0, emailService_1.sendEmail)({
            to: email,
            subject,
            html: content
        }));
        await Promise.all(emailPromises);
        const campaign = {
            id: `campaign_${Date.now()}`,
            name,
            subject,
            content,
            type,
            status: 'sent',
            sentAt: new Date().toISOString(),
            recipients: customerEmails.length,
            openRate: 0,
            clickRate: 0
        };
        res.json({ campaign });
    }
    catch (error) {
        console.error('Error sending email campaign:', error);
        res.status(500).json({ message: 'Failed to send email campaign' });
    }
});
router.post('/automation-rules', authenticateAdmin, async (req, res) => {
    try {
        const { name, trigger, triggerDays, emailTemplate } = req.body;
        const rule = {
            id: `rule_${Date.now()}`,
            name,
            trigger,
            triggerDays,
            emailTemplate,
            isActive: true,
            createdAt: new Date().toISOString()
        };
        res.json({ rule });
    }
    catch (error) {
        console.error('Error creating automation rule:', error);
        res.status(500).json({ message: 'Failed to create automation rule' });
    }
});
router.post('/coupons', authenticateAdmin, async (req, res) => {
    try {
        const { code, type, value, description, expiresAt, maxUses } = req.body;
        const couponData = {
            id: code.toLowerCase().replace(/\s+/g, '_'),
            name: description,
            metadata: { description }
        };
        if (type === 'percent') {
            couponData.percent_off = value;
        }
        else {
            couponData.amount_off = value * 100;
            couponData.currency = 'usd';
        }
        if (expiresAt) {
            couponData.redeem_by = Math.floor(new Date(expiresAt).getTime() / 1000);
        }
        if (maxUses) {
            couponData.max_redemptions = maxUses;
        }
        const stripeCoupon = await stripe.coupons.create(couponData);
        const coupon = {
            id: stripeCoupon.id,
            code: stripeCoupon.id,
            type,
            value,
            description,
            expiresAt,
            maxUses,
            usedCount: stripeCoupon.times_redeemed || 0,
            isActive: stripeCoupon.valid,
            createdAt: new Date(stripeCoupon.created * 1000).toISOString()
        };
        res.json({ coupon });
    }
    catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ message: 'Failed to create coupon' });
    }
});
router.post('/customers/:customerId/apply-coupon', authenticateAdmin, async (req, res) => {
    try {
        const { customerId } = req.params;
        const { couponId } = req.body;
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1
        });
        if (subscriptions.data.length === 0) {
            return res.status(400).json({ message: 'No active subscription found' });
        }
        const subscription = subscriptions.data[0];
        await stripe.subscriptions.update(subscription.id, {
            coupon: couponId
        });
        res.json({ message: 'Coupon applied successfully' });
    }
    catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ message: 'Failed to apply coupon' });
    }
});
router.get('/email-campaigns', authenticateAdmin, async (req, res) => {
    try {
        const campaigns = [
            {
                id: 'campaign_1',
                name: 'Welcome Series',
                subject: 'Welcome to LAURx!',
                content: '<h1>Welcome!</h1><p>Thank you for subscribing.</p>',
                type: 'thank_you',
                status: 'sent',
                sentAt: new Date().toISOString(),
                recipients: 25,
                openRate: 28.5,
                clickRate: 4.2
            }
        ];
        res.json({ campaigns });
    }
    catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
});
router.get('/automation-rules', authenticateAdmin, async (req, res) => {
    try {
        const rules = [
            {
                id: 'rule_1',
                name: 'Subscription Ending Reminder',
                trigger: 'subscription_ending',
                triggerDays: 3,
                emailTemplate: 'Your subscription is ending soon. Renew now!',
                isActive: true,
                createdAt: new Date().toISOString()
            }
        ];
        res.json({ rules });
    }
    catch (error) {
        console.error('Error fetching automation rules:', error);
        res.status(500).json({ message: 'Failed to fetch automation rules' });
    }
});
router.get('/coupons', authenticateAdmin, async (req, res) => {
    try {
        const stripeCoupons = await stripe.coupons.list({ limit: 50 });
        const coupons = stripeCoupons.data.map(coupon => ({
            id: coupon.id,
            code: coupon.id,
            type: coupon.percent_off ? 'percent' : 'amount',
            value: coupon.percent_off || (coupon.amount_off ? coupon.amount_off / 100 : 0),
            description: coupon.metadata?.description || coupon.name || 'No description',
            expiresAt: coupon.redeem_by ? new Date(coupon.redeem_by * 1000).toISOString() : undefined,
            maxUses: coupon.max_redemptions,
            usedCount: coupon.times_redeemed || 0,
            isActive: coupon.valid,
            createdAt: new Date(coupon.created * 1000).toISOString()
        }));
        res.json({ coupons });
    }
    catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ message: 'Failed to fetch coupons' });
    }
});
router.get('/email-config', authenticateAdmin, async (req, res) => {
    try {
        const status = (0, emailValidator_1.getEmailConfigStatus)();
        res.json({ status });
    }
    catch (error) {
        console.error('Error getting email config status:', error);
        res.status(500).json({ message: 'Failed to get email configuration status' });
    }
});
router.post('/email-config/test-smtp', authenticateAdmin, async (req, res) => {
    try {
        const result = await (0, emailValidator_1.testSMTPConnection)();
        res.json({ result });
    }
    catch (error) {
        console.error('Error testing SMTP connection:', error);
        res.status(500).json({ message: 'Failed to test SMTP connection' });
    }
});
router.post('/email-config/send-test', authenticateAdmin, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email address is required' });
        }
        const result = await (0, emailValidator_1.sendTestEmail)(email);
        res.json({ result });
    }
    catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({ message: 'Failed to send test email' });
    }
});
router.post('/email-config/validate', authenticateAdmin, async (req, res) => {
    try {
        const validation = (0, emailValidator_1.validateEmailConfig)();
        res.json({ validation });
    }
    catch (error) {
        console.error('Error validating email config:', error);
        res.status(500).json({ message: 'Failed to validate email configuration' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map