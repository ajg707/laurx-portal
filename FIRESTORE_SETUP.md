# Firestore Setup for Stripe Data Caching

This guide explains how to set up Firestore to cache Stripe data and reduce API rate limits.

## Why Firestore Caching?

Fetching all customer, subscription, invoice, and charge data from Stripe every time can lead to:
- API rate limiting
- Slow response times
- Higher costs

By caching this data in Firestore and using webhooks to keep it updated, we can:
- Serve data instantly from Firestore
- Only query Stripe when absolutely necessary
- Handle much higher traffic without rate limits

## Setup Steps

### 1. Enable Firestore in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `lr-subscriber-portal-68069`
3. Navigate to **Build** > **Firestore Database**
4. Click **Create database**
5. Choose **Production mode**
6. Select your preferred region (US Central is recommended)

### 2. Set up Firebase Admin Credentials

#### For Local Development:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Get application default credentials
firebase login --reauth
```

#### For Production (Render):

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click **Generate New Private Key**
3. Download the JSON file
4. In Render Dashboard, go to your API service
5. Add environment variable: `GOOGLE_APPLICATION_CREDENTIALS` = (paste the entire JSON content)

Or set the key inline:
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"lr-subscriber-portal-68069"...}
```

### 3. Initial Data Sync

Run this command to sync existing Stripe data to Firestore:

```bash
cd apps/api
npx tsx src/scripts/syncStripeToFirestore.ts
```

This will copy all existing customers, subscriptions, invoices, and charges from Stripe to Firestore.

### 4. Set up Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter your webhook URL: `https://laurx-api.onrender.com/webhooks/stripe`
4. Select these events to listen to:
   - `customer.created`
   - `customer.updated`
   - `customer.deleted`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.created`
   - `invoice.updated`
   - `invoice.finalized`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `charge.succeeded`
   - `charge.updated`
   - `charge.refunded`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add to Render environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

### 5. Update Admin Endpoints (Optional)

To use Firestore cache in admin endpoints, you can modify the `/api/admin/customers` endpoint to:
1. First try to fetch from Firestore cache
2. Fall back to Stripe API if cache is empty or stale
3. Refresh cache in background if needed

Example:
```typescript
import { getCustomersFromCache, getSubscriptionsFromCache } from '../services/firestore'

router.get('/customers', async (req, res) => {
  try {
    // Try cache first
    const cachedCustomers = await getCustomersFromCache()

    if (cachedCustomers.length > 0) {
      // Use cache - instant response!
      res.json({ customers: cachedCustomers })
    } else {
      // Fall back to Stripe API
      const stripeCustomers = await stripe.customers.list({ limit: 100 })
      // ... existing code
    }
  } catch (error) {
    // ... error handling
  }
})
```

## Firestore Collections Structure

### customers
```
{
  stripeId: string
  email: string
  name: string
  created: number (unix timestamp)
  metadata: object
  lastUpdated: number (unix timestamp)
}
```

### subscriptions
```
{
  stripeId: string
  customerId: string
  status: string
  currentPeriodEnd: number
  currentPeriodStart: number
  cancelAtPeriodEnd: boolean
  planId: string
  planAmount: number
  planInterval: string
  planNickname: string
  lastUpdated: number
}
```

### invoices
```
{
  stripeId: string
  customerId: string
  status: string
  amountPaid: number
  amountDue: number
  created: number
  description: string
  hostedInvoiceUrl: string
  lastUpdated: number
}
```

### charges
```
{
  stripeId: string
  customerId: string
  status: string
  amount: number
  created: number
  description: string
  receiptUrl: string
  lastUpdated: number
}
```

## Testing

1. Create a test customer in Stripe
2. Check that the webhook fires and data appears in Firestore
3. Query the admin API to verify it returns the customer

## Monitoring

- Check webhook logs in Stripe Dashboard to ensure they're succeeding
- View Firestore data in Firebase Console
- Check webhook_events collection for debugging

## Cost Estimates

- Firestore: First 50K reads/day are free, then $0.06 per 100K reads
- With 72 customers, expect ~1K reads/day = FREE
- Firestore storage: First 1GB free = plenty for this use case

## Next Steps

After implementing Firestore caching, you can:
1. Add customer grouping/segmentation in Firestore
2. Store email campaign history
3. Track automation execution
4. Add real-time customer analytics
