"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeRoutes = void 0;
const express_1 = __importDefault(require("express"));
const stripe_1 = __importDefault(require("stripe"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../utils/auth");
const router = express_1.default.Router();
exports.stripeRoutes = router;
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
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
router.get('/subscriptions', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const customers = await stripe.customers.list({
            email: userEmail,
            limit: 1
        });
        if (customers.data.length === 0) {
            return res.json({ subscriptions: [] });
        }
        const customer = customers.data[0];
        const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'all',
            expand: ['data.default_payment_method', 'data.items.data.price.product']
        });
        const formattedSubscriptions = subscriptions.data.map(sub => ({
            id: sub.id,
            status: sub.status,
            current_period_start: sub.current_period_start,
            current_period_end: sub.current_period_end,
            cancel_at_period_end: sub.cancel_at_period_end,
            canceled_at: sub.canceled_at,
            items: sub.items.data.map(item => ({
                id: item.id,
                price: {
                    id: item.price.id,
                    unit_amount: item.price.unit_amount,
                    currency: item.price.currency,
                    recurring: item.price.recurring,
                    product: item.price.product
                },
                quantity: item.quantity
            })),
            default_payment_method: sub.default_payment_method
        }));
        res.json({ subscriptions: formattedSubscriptions });
    }
    catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});
router.post('/subscriptions/:subscriptionId/cancel', authenticateToken, async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const { cancel_at_period_end = true } = req.body;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customer = await stripe.customers.retrieve(subscription.customer);
        if (typeof customer === 'string' || !('email' in customer) || customer.email !== req.user.email) {
            return res.status(403).json({ error: 'Unauthorized to cancel this subscription' });
        }
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end
        });
        res.json({
            message: cancel_at_period_end
                ? 'Subscription will be canceled at the end of the current period'
                : 'Subscription canceled immediately',
            subscription: {
                id: updatedSubscription.id,
                status: updatedSubscription.status,
                cancel_at_period_end: updatedSubscription.cancel_at_period_end,
                current_period_end: updatedSubscription.current_period_end
            }
        });
    }
    catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});
router.post('/subscriptions/:subscriptionId/reactivate', authenticateToken, async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customer = await stripe.customers.retrieve(subscription.customer);
        if (typeof customer === 'string' || !('email' in customer) || customer.email !== req.user.email) {
            return res.status(403).json({ error: 'Unauthorized to reactivate this subscription' });
        }
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false
        });
        res.json({
            message: 'Subscription reactivated successfully',
            subscription: {
                id: updatedSubscription.id,
                status: updatedSubscription.status,
                cancel_at_period_end: updatedSubscription.cancel_at_period_end,
                current_period_end: updatedSubscription.current_period_end
            }
        });
    }
    catch (error) {
        console.error('Error reactivating subscription:', error);
        res.status(500).json({ error: 'Failed to reactivate subscription' });
    }
});
router.get('/invoices', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const customers = await stripe.customers.list({
            email: userEmail,
            limit: 1
        });
        if (customers.data.length === 0) {
            return res.json({ invoices: [] });
        }
        const customer = customers.data[0];
        const invoices = await stripe.invoices.list({
            customer: customer.id,
            limit: 50
        });
        const formattedInvoices = invoices.data.map(invoice => ({
            id: invoice.id,
            number: invoice.number,
            status: invoice.status,
            amount_due: invoice.amount_due,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
            created: invoice.created,
            due_date: invoice.due_date,
            hosted_invoice_url: invoice.hosted_invoice_url,
            invoice_pdf: invoice.invoice_pdf,
            period_start: invoice.period_start,
            period_end: invoice.period_end
        }));
        res.json({ invoices: formattedInvoices });
    }
    catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});
router.get('/payment-methods', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const customers = await stripe.customers.list({
            email: userEmail,
            limit: 1
        });
        if (customers.data.length === 0) {
            return res.json({ payment_methods: [] });
        }
        const customer = customers.data[0];
        const paymentMethods = await stripe.paymentMethods.list({
            customer: customer.id,
            type: 'card'
        });
        const formattedPaymentMethods = paymentMethods.data.map(pm => ({
            id: pm.id,
            type: pm.type,
            card: pm.card ? {
                brand: pm.card.brand,
                last4: pm.card.last4,
                exp_month: pm.card.exp_month,
                exp_year: pm.card.exp_year
            } : null,
            created: pm.created
        }));
        res.json({ payment_methods: formattedPaymentMethods });
    }
    catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
});
router.post('/setup-intent', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        let customers = await stripe.customers.list({
            email: userEmail,
            limit: 1
        });
        let customer;
        if (customers.data.length === 0) {
            customer = await stripe.customers.create({
                email: userEmail
            });
        }
        else {
            customer = customers.data[0];
        }
        const setupIntent = await stripe.setupIntents.create({
            customer: customer.id,
            payment_method_types: ['card'],
            usage: 'off_session'
        });
        res.json({
            client_secret: setupIntent.client_secret,
            customer_id: customer.id
        });
    }
    catch (error) {
        console.error('Error creating setup intent:', error);
        res.status(500).json({ error: 'Failed to create setup intent' });
    }
});
router.delete('/payment-methods/:paymentMethodId', authenticateToken, async (req, res) => {
    try {
        const { paymentMethodId } = req.params;
        const userEmail = req.user.email;
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        if (!paymentMethod.customer) {
            return res.status(404).json({ error: 'Payment method not found' });
        }
        const customer = await stripe.customers.retrieve(paymentMethod.customer);
        if (typeof customer === 'string' || !('email' in customer) || customer.email !== userEmail) {
            return res.status(403).json({ error: 'Unauthorized to delete this payment method' });
        }
        await stripe.paymentMethods.detach(paymentMethodId);
        res.json({ message: 'Payment method deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting payment method:', error);
        res.status(500).json({ error: 'Failed to delete payment method' });
    }
});
router.get('/customer', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const customers = await stripe.customers.list({
            email: userEmail,
            limit: 1
        });
        if (customers.data.length === 0) {
            return res.json({ customer: null });
        }
        const customer = customers.data[0];
        res.json({
            customer: {
                id: customer.id,
                email: customer.email,
                name: customer.name,
                created: customer.created,
                default_source: customer.default_source,
                invoice_prefix: customer.invoice_prefix
            }
        });
    }
    catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Failed to fetch customer details' });
    }
});
//# sourceMappingURL=stripe.js.map