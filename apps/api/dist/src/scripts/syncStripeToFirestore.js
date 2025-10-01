"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const stripe_1 = __importDefault(require("stripe"));
const firestore_1 = require("../services/firestore");
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv_1.default.config({ path: envPath });
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16'
});
async function syncStripeToFirestore() {
    console.log('🔄 Starting Stripe to Firestore sync...');
    try {
        console.log('📦 Syncing customers...');
        const customers = await stripe.customers.list({ limit: 100 });
        for (const customer of customers.data) {
            await (0, firestore_1.saveCustomer)(customer);
            console.log(`  ✓ Saved customer: ${customer.email || customer.id}`);
        }
        console.log(`✅ Synced ${customers.data.length} customers`);
        console.log('📦 Syncing subscriptions...');
        const subscriptions = await stripe.subscriptions.list({ limit: 100 });
        for (const subscription of subscriptions.data) {
            await (0, firestore_1.saveSubscription)(subscription);
            console.log(`  ✓ Saved subscription: ${subscription.id}`);
        }
        console.log(`✅ Synced ${subscriptions.data.length} subscriptions`);
        console.log('📦 Syncing invoices...');
        const invoices = await stripe.invoices.list({ limit: 100 });
        for (const invoice of invoices.data) {
            await (0, firestore_1.saveInvoice)(invoice);
            console.log(`  ✓ Saved invoice: ${invoice.id}`);
        }
        console.log(`✅ Synced ${invoices.data.length} invoices`);
        console.log('📦 Syncing charges...');
        const charges = await stripe.charges.list({ limit: 100 });
        for (const charge of charges.data) {
            await (0, firestore_1.saveCharge)(charge);
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