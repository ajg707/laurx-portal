"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const firestore_1 = require("../services/firestore");
const router = (0, express_1.Router)();
const stripe = process.env.STRIPE_SECRET_KEY
    ? new stripe_1.default(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
    : null;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
router.post('/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig || !WEBHOOK_SECRET || !stripe) {
        return res.status(400).json({ error: 'Webhook signature or secret missing' });
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).json({ error: 'Webhook signature verification failed' });
    }
    await (0, firestore_1.logWebhookEvent)(event);
    try {
        switch (event.type) {
            case 'customer.created':
            case 'customer.updated':
                await (0, firestore_1.saveCustomer)(event.data.object);
                console.log('Customer saved to Firestore:', event.data.object.id);
                break;
            case 'customer.deleted':
                await (0, firestore_1.deleteCustomer)(event.data.object.id);
                console.log('Customer deleted from Firestore:', event.data.object.id);
                break;
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await (0, firestore_1.saveSubscription)(event.data.object);
                console.log('Subscription saved to Firestore:', event.data.object.id);
                break;
            case 'customer.subscription.deleted':
                await (0, firestore_1.deleteSubscription)(event.data.object.id);
                console.log('Subscription deleted from Firestore:', event.data.object.id);
                break;
            case 'invoice.created':
            case 'invoice.updated':
            case 'invoice.finalized':
            case 'invoice.paid':
            case 'invoice.payment_failed':
                await (0, firestore_1.saveInvoice)(event.data.object);
                console.log('Invoice saved to Firestore:', event.data.object.id);
                break;
            case 'charge.succeeded':
            case 'charge.updated':
            case 'charge.refunded':
                await (0, firestore_1.saveCharge)(event.data.object);
                console.log('Charge saved to Firestore:', event.data.object.id);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Error processing webhook' });
    }
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map