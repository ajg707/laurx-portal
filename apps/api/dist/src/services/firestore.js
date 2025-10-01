"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collections = exports.isFirebaseInitialized = exports.db = void 0;
exports.saveCustomer = saveCustomer;
exports.saveSubscription = saveSubscription;
exports.saveInvoice = saveInvoice;
exports.saveCharge = saveCharge;
exports.deleteCustomer = deleteCustomer;
exports.deleteSubscription = deleteSubscription;
exports.getCustomersFromCache = getCustomersFromCache;
exports.getSubscriptionsFromCache = getSubscriptionsFromCache;
exports.getInvoicesFromCache = getInvoicesFromCache;
exports.getChargesFromCache = getChargesFromCache;
exports.logWebhookEvent = logWebhookEvent;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let isFirebaseInitialized = false;
exports.isFirebaseInitialized = isFirebaseInitialized;
if (!firebase_admin_1.default.apps.length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        try {
            const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID || 'lr-subscriber-portal-68069'
            });
            console.log('✅ Firebase Admin initialized with service account credentials');
            exports.isFirebaseInitialized = isFirebaseInitialized = true;
        }
        catch (error) {
            console.error('❌ Failed to parse Firebase credentials:', error);
            console.warn('⚠️  Customer groups and Firestore cache features will be disabled');
        }
    }
    else {
        try {
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.applicationDefault(),
                projectId: process.env.FIREBASE_PROJECT_ID || 'lr-subscriber-portal-68069'
            });
            console.log('✅ Firebase Admin initialized with application default credentials');
            exports.isFirebaseInitialized = isFirebaseInitialized = true;
        }
        catch (error) {
            console.error('❌ Firebase Admin not initialized - credentials not found');
            console.warn('⚠️  Customer groups and Firestore cache features will be disabled');
            console.warn('⚠️  Set GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable to enable');
        }
    }
}
exports.db = firebase_admin_1.default.apps.length > 0 ? firebase_admin_1.default.firestore() : null;
exports.Collections = {
    CUSTOMERS: 'customers',
    SUBSCRIPTIONS: 'subscriptions',
    INVOICES: 'invoices',
    CHARGES: 'charges',
    COUPONS: 'coupons',
    WEBHOOK_EVENTS: 'webhook_events',
    CUSTOMER_GROUPS: 'customer_groups',
    EMAIL_CAMPAIGNS: 'email_campaigns',
    AUTOMATION_RULES: 'automation_rules'
};
async function saveCustomer(customer) {
    const doc = {
        stripeId: customer.id,
        email: customer.email,
        name: customer.name,
        created: customer.created,
        metadata: customer.metadata || {},
        lastUpdated: Date.now()
    };
    await exports.db.collection(exports.Collections.CUSTOMERS).doc(customer.id).set(doc, { merge: true });
}
async function saveSubscription(subscription) {
    const doc = {
        stripeId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        currentPeriodStart: subscription.current_period_start,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        planId: subscription.items.data[0]?.price.id || '',
        planAmount: subscription.items.data[0]?.price.unit_amount || 0,
        planInterval: subscription.items.data[0]?.price.recurring?.interval || 'month',
        planNickname: subscription.items.data[0]?.price.nickname || null,
        lastUpdated: Date.now()
    };
    await exports.db.collection(exports.Collections.SUBSCRIPTIONS).doc(subscription.id).set(doc, { merge: true });
}
async function saveInvoice(invoice) {
    const doc = {
        stripeId: invoice.id,
        customerId: invoice.customer,
        status: invoice.status,
        amountPaid: invoice.amount_paid || 0,
        amountDue: invoice.amount_due || 0,
        created: invoice.created,
        description: invoice.description || null,
        hostedInvoiceUrl: invoice.hosted_invoice_url || null,
        charge: invoice.charge || null,
        lastUpdated: Date.now()
    };
    await exports.db.collection(exports.Collections.INVOICES).doc(invoice.id).set(doc, { merge: true });
}
async function saveCharge(charge) {
    const doc = {
        stripeId: charge.id,
        customerId: charge.customer,
        status: charge.status,
        amount: charge.amount,
        created: charge.created,
        description: charge.description || null,
        receiptUrl: charge.receipt_url || null,
        lastUpdated: Date.now()
    };
    await exports.db.collection(exports.Collections.CHARGES).doc(charge.id).set(doc, { merge: true });
}
async function deleteCustomer(customerId) {
    await exports.db.collection(exports.Collections.CUSTOMERS).doc(customerId).delete();
}
async function deleteSubscription(subscriptionId) {
    await exports.db.collection(exports.Collections.SUBSCRIPTIONS).doc(subscriptionId).delete();
}
async function getCustomersFromCache() {
    const snapshot = await exports.db.collection(exports.Collections.CUSTOMERS).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
async function getSubscriptionsFromCache(customerId) {
    let query = exports.db.collection(exports.Collections.SUBSCRIPTIONS);
    if (customerId) {
        query = query.where('customerId', '==', customerId);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
async function getInvoicesFromCache(customerId) {
    let query = exports.db.collection(exports.Collections.INVOICES);
    if (customerId) {
        query = query.where('customerId', '==', customerId);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
async function getChargesFromCache(customerId) {
    let query = exports.db.collection(exports.Collections.CHARGES);
    if (customerId) {
        query = query.where('customerId', '==', customerId);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
async function logWebhookEvent(event) {
    await exports.db.collection(exports.Collections.WEBHOOK_EVENTS).add({
        eventId: event.id,
        type: event.type,
        created: event.created,
        data: event.data,
        receivedAt: Date.now()
    });
}
//# sourceMappingURL=firestore.js.map