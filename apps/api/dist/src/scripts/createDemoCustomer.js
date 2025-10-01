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
const stripe_1 = __importDefault(require("stripe"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });
async function createDemoCustomer() {
    try {
        const email = 'mglynn@mylaurelrose.com';
        const name = 'Michelle Glynn';
        console.log('Creating demo customer...');
        const existingCustomers = await stripe.customers.list({ email, limit: 1 });
        let customer;
        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
            console.log(`Customer already exists: ${customer.id}`);
        }
        else {
            customer = await stripe.customers.create({
                email,
                name,
                description: 'Demo customer account for portal preview'
            });
            console.log(`Created customer: ${customer.id}`);
        }
        let product;
        const products = await stripe.products.list({ limit: 1 });
        if (products.data.length === 0) {
            product = await stripe.products.create({
                name: 'LAURx Monthly Subscription',
                description: 'Monthly subscription service'
            });
            console.log(`Created product: ${product.id}`);
            await stripe.prices.create({
                product: product.id,
                unit_amount: 2999,
                currency: 'usd',
                recurring: {
                    interval: 'month'
                }
            });
            console.log('Created price');
        }
        else {
            product = products.data[0];
            console.log(`Using existing product: ${product.id}`);
        }
        const prices = await stripe.prices.list({ product: product.id, limit: 100 });
        let price = prices.data.find(p => p.recurring !== null);
        if (!price) {
            price = await stripe.prices.create({
                product: product.id,
                unit_amount: 2999,
                currency: 'usd',
                recurring: {
                    interval: 'month'
                }
            });
            console.log('Created recurring price');
        }
        const existingSubs = await stripe.subscriptions.list({
            customer: customer.id,
            limit: 1
        });
        if (existingSubs.data.length === 0) {
            const subscription = await stripe.subscriptions.create({
                customer: customer.id,
                items: [{ price: price.id }],
                trial_period_days: 14
            });
            console.log(`Created subscription: ${subscription.id}`);
        }
        else {
            console.log(`Customer already has subscription: ${existingSubs.data[0].id}`);
        }
        const charges = await stripe.charges.list({ customer: customer.id, limit: 5 });
        console.log(`Customer has ${charges.data.length} payment(s) on record`);
        console.log('\n✅ Demo customer setup complete!');
        console.log(`\nCustomer Details:`);
        console.log(`  Email: ${email}`);
        console.log(`  Name: ${name}`);
        console.log(`  Stripe ID: ${customer.id}`);
        console.log(`\nThey can now log into the customer portal at:`);
        console.log(`  https://lr-subscriber-portal-68069.web.app`);
        console.log(`\nA verification code will be sent to their email when they log in.`);
    }
    catch (error) {
        console.error('Error creating demo customer:', error);
        process.exit(1);
    }
}
createDemoCustomer();
//# sourceMappingURL=createDemoCustomer.js.map