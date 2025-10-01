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
router.get('/customers/:customerId', authenticateAdmin, async (req, res) => {
    try {
        const { customerId } = req.params;
        if (!stripe) {
            return res.status(500).json({ message: 'Stripe not configured' });
        }
        const [customer, charges, invoices, subscriptions] = await Promise.all([
            stripe.customers.retrieve(customerId),
            stripe.charges.list({ customer: customerId, limit: 100 }),
            stripe.invoices.list({ customer: customerId, limit: 100 }),
            stripe.subscriptions.list({ customer: customerId, limit: 100 })
        ]);
        const orderHistory = charges.data.map(charge => ({
            id: charge.id,
            date: new Date(charge.created * 1000).toISOString(),
            amount: charge.amount / 100,
            status: charge.status,
            description: charge.description || 'Payment',
            receiptUrl: charge.receipt_url,
            type: 'charge'
        }));
        const invoiceOrders = invoices.data
            .filter(inv => inv.status === 'paid')
            .map(invoice => ({
            id: invoice.id,
            date: new Date(invoice.created * 1000).toISOString(),
            amount: invoice.amount_paid / 100,
            status: 'paid',
            description: invoice.description || 'Subscription payment',
            receiptUrl: invoice.hosted_invoice_url,
            type: 'invoice'
        }));
        const allOrders = [...orderHistory, ...invoiceOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const activeSubscriptions = subscriptions.data.map(sub => ({
            id: sub.id,
            status: sub.status,
            plan: sub.items.data[0]?.price.nickname || 'Subscription',
            amount: sub.items.data[0]?.price.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 0,
            interval: sub.items.data[0]?.price.recurring?.interval || 'month',
            currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: sub.cancel_at_period_end
        }));
        const totalSpent = allOrders.reduce((sum, order) => sum + order.amount, 0);
        res.json({
            customer: {
                id: customer.id,
                email: customer.email,
                name: customer.name,
                created: new Date(customer.created * 1000).toISOString()
            },
            orderHistory: allOrders,
            subscriptions: activeSubscriptions,
            totalSpent,
            orderCount: allOrders.length
        });
    }
    catch (error) {
        console.error('Error fetching customer details:', error);
        res.status(500).json({ message: 'Failed to fetch customer details' });
    }
});
router.get('/customers', authenticateAdmin, async (req, res) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({ message: 'Stripe API key not configured' });
        }
        let customersData = [];
        let subscriptionsData = [];
        let invoicesData = [];
        let chargesData = [];
        try {
            const { getCustomersFromCache, getSubscriptionsFromCache, getInvoicesFromCache, getChargesFromCache } = await Promise.resolve().then(() => __importStar(require('../services/firestore')));
            const [cachedCustomers, cachedSubscriptions, cachedInvoices, cachedCharges] = await Promise.all([
                getCustomersFromCache(),
                getSubscriptionsFromCache(),
                getInvoicesFromCache(),
                getChargesFromCache()
            ]);
            if (cachedCustomers.length > 0) {
                console.log(`📦 Using Firestore cache: ${cachedCustomers.length} customers`);
                customersData = cachedCustomers;
                subscriptionsData = cachedSubscriptions;
                invoicesData = cachedInvoices;
                chargesData = cachedCharges;
            }
        }
        catch (cacheError) {
            console.log('⚠️  Firestore cache unavailable, falling back to Stripe API:', cacheError);
        }
        if (customersData.length === 0) {
            console.log('🔄 Fetching from Stripe API (cache empty)');
            const [customersResponse, subscriptionsResponse, invoicesResponse, chargesResponse] = await Promise.all([
                stripe.customers.list({ limit: 100 }),
                stripe.subscriptions.list({ limit: 100 }),
                stripe.invoices.list({ limit: 100 }),
                stripe.charges.list({ limit: 100 })
            ]);
            customersData = customersResponse.data.map((c) => ({
                stripeId: c.id,
                email: c.email,
                name: c.name,
                created: c.created,
                metadata: c.metadata || {}
            }));
            subscriptionsData = subscriptionsResponse.data.map((s) => ({
                stripeId: s.id,
                customerId: typeof s.customer === 'string' ? s.customer : s.customer?.id,
                status: s.status,
                currentPeriodEnd: s.current_period_end,
                currentPeriodStart: s.current_period_start,
                cancelAtPeriodEnd: s.cancel_at_period_end,
                planId: s.items.data[0]?.price.id || '',
                planAmount: s.items.data[0]?.price.unit_amount || 0,
                planInterval: s.items.data[0]?.price.recurring?.interval || 'month',
                planNickname: s.items.data[0]?.price.nickname || null
            }));
            invoicesData = invoicesResponse.data.map((i) => ({
                stripeId: i.id,
                customerId: typeof i.customer === 'string' ? i.customer : i.customer?.id,
                status: i.status,
                amountPaid: i.amount_paid || 0,
                amountDue: i.amount_due || 0,
                created: i.created,
                description: i.description || null,
                hostedInvoiceUrl: i.hosted_invoice_url || null
            }));
            chargesData = chargesResponse.data.map((ch) => ({
                stripeId: ch.id,
                customerId: ch.customer,
                status: ch.status,
                amount: ch.amount,
                created: ch.created,
                description: ch.description || null,
                receiptUrl: ch.receipt_url || null
            }));
        }
        const subscriptionsByCustomer = new Map();
        subscriptionsData.forEach(sub => {
            const customerId = sub.customerId || sub.stripeId;
            if (customerId) {
                const existing = subscriptionsByCustomer.get(customerId) || [];
                existing.push(sub);
                subscriptionsByCustomer.set(customerId, existing);
            }
        });
        const invoicesByCustomer = new Map();
        invoicesData.forEach(inv => {
            const customerId = inv.customerId;
            if (customerId) {
                const existing = invoicesByCustomer.get(customerId) || [];
                existing.push(inv);
                invoicesByCustomer.set(customerId, existing);
            }
        });
        const chargesByCustomer = new Map();
        chargesData.forEach(charge => {
            const customerId = charge.customerId;
            if (customerId) {
                const existing = chargesByCustomer.get(customerId) || [];
                existing.push(charge);
                chargesByCustomer.set(customerId, existing);
            }
        });
        const customersWithSubscriptions = customersData.map(customer => {
            const customerId = customer.stripeId || customer.id;
            const customerSubs = subscriptionsByCustomer.get(customerId) || [];
            const customerInvoices = invoicesByCustomer.get(customerId) || [];
            const customerCharges = chargesByCustomer.get(customerId) || [];
            const invoiceTotal = customerInvoices
                .filter(inv => inv.status === 'paid' && inv.amountPaid)
                .reduce((sum, invoice) => sum + invoice.amountPaid, 0);
            const chargeTotal = customerCharges
                .filter(charge => charge.status === 'succeeded')
                .reduce((sum, charge) => sum + charge.amount, 0);
            const totalSpent = (invoiceTotal + chargeTotal) / 100;
            const hasActiveSubscription = customerSubs.some(sub => ['active', 'trialing', 'past_due'].includes(sub.status));
            return {
                id: customerId,
                email: customer.email,
                name: customer.name || customer.email,
                subscriptions: customerSubs.map(sub => ({
                    id: sub.stripeId || sub.id,
                    status: sub.status,
                    currentPeriodEnd: new Date(sub.currentPeriodEnd * 1000).toISOString(),
                    product: sub.planNickname || 'Unknown',
                    price: (sub.planAmount || 0) / 100,
                    interval: sub.planInterval || 'month'
                })),
                totalSpent,
                createdAt: new Date(customer.created * 1000).toISOString(),
                lastOrderDate: customerInvoices[0] ? new Date(customerInvoices[0].created * 1000).toISOString() : undefined,
                status: hasActiveSubscription ? 'active' :
                    customerSubs.length > 0 ? 'inactive' : 'churned'
            };
        });
        res.json({ customers: customersWithSubscriptions });
    }
    catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Failed to fetch customers' });
    }
});
router.get('/analytics', authenticateAdmin, async (req, res) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({ message: 'Stripe API key not configured' });
        }
        const customers = await stripe.customers.list({ limit: 100 });
        const subscriptions = await stripe.subscriptions.list({ limit: 100 });
        const invoices = await stripe.invoices.list({ limit: 100 });
        const charges = await stripe.charges.list({ limit: 100 });
        const activeSubscriptions = subscriptions.data.filter(sub => ['active', 'trialing', 'past_due'].includes(sub.status)).length;
        const totalCustomers = customers.data.length;
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        const monthlyInvoices = invoices.data.filter(invoice => invoice.status === 'paid' && new Date(invoice.created * 1000) >= currentMonth);
        const monthlyInvoiceRevenue = monthlyInvoices.reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0);
        const monthlyCharges = charges.data.filter(charge => charge.status === 'succeeded' && new Date(charge.created * 1000) >= currentMonth);
        const monthlyChargeRevenue = monthlyCharges.reduce((sum, charge) => sum + charge.amount, 0);
        const monthlyRevenue = (monthlyInvoiceRevenue + monthlyChargeRevenue) / 100;
        const allTimeInvoiceRevenue = invoices.data
            .filter(invoice => invoice.status === 'paid')
            .reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0);
        const allTimeChargeRevenue = charges.data
            .filter(charge => charge.status === 'succeeded')
            .reduce((sum, charge) => sum + charge.amount, 0);
        const allTimeRevenue = (allTimeInvoiceRevenue + allTimeChargeRevenue) / 100;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const last30DaysInvoices = invoices.data.filter(invoice => invoice.status === 'paid' && new Date(invoice.created * 1000) >= thirtyDaysAgo);
        const last30DaysInvoiceRevenue = last30DaysInvoices.reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0);
        const last30DaysCharges = charges.data.filter(charge => charge.status === 'succeeded' && new Date(charge.created * 1000) >= thirtyDaysAgo);
        const last30DaysChargeRevenue = last30DaysCharges.reduce((sum, charge) => sum + charge.amount, 0);
        const last30DaysRevenue = (last30DaysInvoiceRevenue + last30DaysChargeRevenue) / 100;
        const cancelledSubs = subscriptions.data.filter(sub => sub.status === 'canceled').length;
        const churnRate = totalCustomers > 0 ? (cancelledSubs / totalCustomers) * 100 : 0;
        const recentInvoiceActivity = invoices.data
            .filter(inv => inv.status === 'paid')
            .map(invoice => ({
            id: invoice.id,
            type: 'payment_received',
            description: `Payment of $${(invoice.amount_paid || 0) / 100} from ${invoice.customer_email || 'customer'}`,
            timestamp: new Date(invoice.created * 1000).toISOString(),
            created: invoice.created
        }));
        const recentChargeActivity = charges.data
            .filter(charge => charge.status === 'succeeded')
            .map(charge => ({
            id: charge.id,
            type: 'payment_received',
            description: `Charge of $${charge.amount / 100} from ${charge.billing_details?.email || 'customer'}`,
            timestamp: new Date(charge.created * 1000).toISOString(),
            created: charge.created
        }));
        const recentActivity = [...recentInvoiceActivity, ...recentChargeActivity]
            .sort((a, b) => b.created - a.created)
            .slice(0, 5)
            .map(({ created, ...rest }) => rest);
        const analytics = {
            totalCustomers,
            activeSubscriptions,
            monthlyRevenue,
            allTimeRevenue,
            last30DaysRevenue,
            churnRate,
            emailStats: {
                campaignsSent: 0,
                averageOpenRate: 0,
                averageClickRate: 0
            },
            recentActivity,
            debug: {
                totalInvoices: invoices.data.length,
                paidInvoices: invoices.data.filter(i => i.status === 'paid').length,
                totalSubscriptions: subscriptions.data.length,
                subscriptionStatuses: subscriptions.data.reduce((acc, sub) => {
                    acc[sub.status] = (acc[sub.status] || 0) + 1;
                    return acc;
                }, {})
            }
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
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer || customer.deleted) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        const coupon = await stripe.coupons.retrieve(couponId);
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
        const customerEmail = customer.email;
        const customerName = customer.name || 'Valued Customer';
        const discountText = coupon.percent_off
            ? `${coupon.percent_off}% off`
            : `$${((coupon.amount_off || 0) / 100).toFixed(2)} off`;
        await (0, emailService_1.sendEmail)({
            to: customerEmail,
            subject: 'Special Discount Applied to Your Subscription!',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed;">Great News, ${customerName}!</h2>
          <p>We've applied a special discount to your subscription:</p>
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <p style="color: white; font-size: 18px; margin: 0;">Your Discount</p>
            <p style="color: white; font-size: 36px; font-weight: bold; margin: 10px 0;">${discountText}</p>
            ${coupon.name ? `<p style="color: #e9d5ff; font-size: 16px; margin: 0;">${coupon.name}</p>` : ''}
          </div>
          ${coupon.duration === 'forever'
                ? '<p style="color: #16a34a; font-weight: bold;">This discount will apply to all future invoices!</p>'
                : coupon.duration === 'repeating'
                    ? `<p style="color: #16a34a; font-weight: bold;">This discount will apply for ${coupon.duration_in_months} months.</p>`
                    : '<p style="color: #16a34a; font-weight: bold;">This discount will apply to your next invoice.</p>'}
          <p>You'll see this discount reflected on your next billing statement.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you have any questions about this discount, please don't hesitate to contact us.
          </p>
          <p style="color: #666; font-size: 12px;">Thank you for being a valued customer!</p>
        </div>
      `
        });
        res.json({ message: 'Coupon applied and customer notified successfully' });
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
router.get('/groups', authenticateAdmin, async (req, res) => {
    try {
        const { getAllGroups } = await Promise.resolve().then(() => __importStar(require('../services/customerGroups')));
        const groups = await getAllGroups();
        res.json({ groups });
    }
    catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ message: 'Failed to fetch customer groups' });
    }
});
router.get('/groups/:groupId', authenticateAdmin, async (req, res) => {
    try {
        const { getGroup } = await Promise.resolve().then(() => __importStar(require('../services/customerGroups')));
        const group = await getGroup(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        res.json({ group });
    }
    catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ message: 'Failed to fetch group' });
    }
});
router.post('/groups', authenticateAdmin, async (req, res) => {
    try {
        const { createGroup } = await Promise.resolve().then(() => __importStar(require('../services/customerGroups')));
        const { name, description, type, customerIds, criteria } = req.body;
        if (!name || !type) {
            return res.status(400).json({ message: 'Name and type are required' });
        }
        if (type === 'static' && !Array.isArray(customerIds)) {
            return res.status(400).json({ message: 'Static groups require customerIds array' });
        }
        if (type === 'dynamic' && !criteria) {
            return res.status(400).json({ message: 'Dynamic groups require criteria' });
        }
        const group = await createGroup({
            name,
            description: description || '',
            type,
            customerIds: type === 'static' ? customerIds : undefined,
            criteria: type === 'dynamic' ? criteria : undefined,
            createdBy: req.adminUser.email
        });
        res.json({ group });
    }
    catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: 'Failed to create group' });
    }
});
router.put('/groups/:groupId', authenticateAdmin, async (req, res) => {
    try {
        const { updateGroup } = await Promise.resolve().then(() => __importStar(require('../services/customerGroups')));
        const { name, description, customerIds, criteria } = req.body;
        await updateGroup(req.params.groupId, {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(customerIds && { customerIds }),
            ...(criteria && { criteria })
        });
        res.json({ message: 'Group updated successfully' });
    }
    catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ message: 'Failed to update group' });
    }
});
router.delete('/groups/:groupId', authenticateAdmin, async (req, res) => {
    try {
        const { deleteGroup } = await Promise.resolve().then(() => __importStar(require('../services/customerGroups')));
        await deleteGroup(req.params.groupId);
        res.json({ message: 'Group deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ message: 'Failed to delete group' });
    }
});
router.get('/groups/:groupId/customers', authenticateAdmin, async (req, res) => {
    try {
        const { getGroupCustomers } = await Promise.resolve().then(() => __importStar(require('../services/customerGroups')));
        const customerIds = await getGroupCustomers(req.params.groupId);
        res.json({ customerIds, count: customerIds.length });
    }
    catch (error) {
        console.error('Error fetching group customers:', error);
        res.status(500).json({ message: 'Failed to fetch group customers' });
    }
});
router.post('/groups/:groupId/customers', authenticateAdmin, async (req, res) => {
    try {
        const { addCustomersToGroup } = await Promise.resolve().then(() => __importStar(require('../services/customerGroups')));
        const { customerIds } = req.body;
        if (!Array.isArray(customerIds)) {
            return res.status(400).json({ message: 'customerIds must be an array' });
        }
        await addCustomersToGroup(req.params.groupId, customerIds);
        res.json({ message: 'Customers added to group successfully' });
    }
    catch (error) {
        console.error('Error adding customers to group:', error);
        res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to add customers to group' });
    }
});
router.delete('/groups/:groupId/customers', authenticateAdmin, async (req, res) => {
    try {
        const { removeCustomersFromGroup } = await Promise.resolve().then(() => __importStar(require('../services/customerGroups')));
        const { customerIds } = req.body;
        if (!Array.isArray(customerIds)) {
            return res.status(400).json({ message: 'customerIds must be an array' });
        }
        await removeCustomersFromGroup(req.params.groupId, customerIds);
        res.json({ message: 'Customers removed from group successfully' });
    }
    catch (error) {
        console.error('Error removing customers from group:', error);
        res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to remove customers from group' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map