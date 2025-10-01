"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const stripe_1 = __importDefault(require("stripe"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const fs_1 = __importDefault(require("fs"));
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv_1.default.config({ path: envPath });
if (!firebase_admin_1.default.apps.length) {
    const keyPath = path_1.default.resolve(process.cwd(), 'firebase-key.json');
    if (fs_1.default.existsSync(keyPath)) {
        const serviceAccount = JSON.parse(fs_1.default.readFileSync(keyPath, 'utf8'));
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID || 'lr-subscriber-portal-68069'
        });
        console.log('✅ Firebase Admin initialized from firebase-key.json');
    }
    else {
        console.error('❌ firebase-key.json not found!');
        console.error('   Please create apps/api/firebase-key.json with your service account credentials');
        process.exit(1);
    }
}
const { saveCustomer, saveSubscription, saveInvoice, saveCharge } = require('../services/firestore');
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16'
});
async function syncStripeToFirestore() {
    console.log('🔄 Starting Stripe to Firestore sync...');
    try {
        console.log('📦 Syncing customers...');
        const customers = await stripe.customers.list({ limit: 100 });
        for (const customer of customers.data) {
            await saveCustomer(customer);
            console.log(`  ✓ Saved customer: ${customer.email || customer.id}`);
        }
        console.log(`✅ Synced ${customers.data.length} customers`);
        console.log('📦 Syncing subscriptions...');
        const subscriptions = await stripe.subscriptions.list({ limit: 100 });
        for (const subscription of subscriptions.data) {
            await saveSubscription(subscription);
            console.log(`  ✓ Saved subscription: ${subscription.id}`);
        }
        console.log(`✅ Synced ${subscriptions.data.length} subscriptions`);
        console.log('📦 Syncing invoices...');
        const invoices = await stripe.invoices.list({ limit: 100 });
        for (const invoice of invoices.data) {
            await saveInvoice(invoice);
            console.log(`  ✓ Saved invoice: ${invoice.id}`);
        }
        console.log(`✅ Synced ${invoices.data.length} invoices`);
        console.log('📦 Syncing charges...');
        const charges = await stripe.charges.list({ limit: 100 });
        for (const charge of charges.data) {
            await saveCharge(charge);
            console.log(`  ✓ Saved charge: ${charge.id}`);
        }
        console.log(`✅ Synced ${charges.data.length} charges`);
        console.log('🎉 Sync complete!');
    }
    catch (error) {
        console.error('❌ Error syncing data:', error);
        process.exit(1);
    }
}
syncStripeToFirestore();
//# sourceMappingURL=syncStripeToFirestore.js.map