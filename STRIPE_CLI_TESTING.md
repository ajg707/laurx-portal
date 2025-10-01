# Stripe CLI Testing Guide

## 🎯 Quick Setup

Since you have the Stripe CLI in the root folder, here's how to test the webhook system:

## 🔐 Step 1: Login to Stripe

```bash
# From the root folder where stripe.exe is located
./stripe login
```

This will open your browser to authenticate.

## 🚀 Step 2: Start Your Services

### Terminal 1: Start API Server
```bash
cd apps/api
npm run dev
```

### Terminal 2: Start Webhook Forwarding
```bash
# From root folder
./stripe listen --forward-to localhost:3001/api/stripe/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

Copy this secret and add it to your `apps/api/.env` file:
```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### Terminal 3: Start Portal Frontend
```bash
cd apps/portal
npm run dev
```

## 🧪 Step 3: Test Payment Events

### Test a Payment Success
```bash
# From root folder
./stripe trigger payment_intent.succeeded
```

### Test Invoice Payment
```bash
./stripe trigger invoice.payment_succeeded
```

### Test Subscription Events
```bash
./stripe trigger customer.subscription.created
./stripe trigger customer.subscription.updated
```

## 📊 Step 4: Verify It's Working

1. **Check API Logs**: You should see webhook processing messages in Terminal 1
2. **Check Payment Database**: Look for `apps/api/data/payment_tracking.json` file
3. **Test Customer Portal**: 
   - Go to http://localhost:3000
   - Login with any email
   - Navigate to "Payment History" page
   - You should see the test payments

## 🔍 Step 5: Test the Customer Portal

1. **Login**: Use any email (like `test@example.com`)
2. **Enter Verification Code**: Check your email or use any 6-digit code for testing
3. **View Payment History**: Click on "Payment History" in the sidebar
4. **Test Verification**: Click "Verify Subscription" buttons to test the verification system

## 📝 Expected Results

✅ **Webhook Processing**: API logs show "✅ Webhook signature verified" messages  
✅ **Payment Storage**: Database file contains payment records  
✅ **Portal Display**: Payment history page shows test payments  
✅ **Subscription Verification**: Status badges show verification results  

## 🛠️ Troubleshooting

### Webhook Not Working?
- Make sure API is running on port 3001
- Check that webhook secret matches in `.env`
- Verify the webhook forwarding command is correct

### Portal Not Loading Data?
- Check browser console for errors
- Verify API server is responding
- Make sure you're logged in

### No Payments Showing?
- Trigger more test events with `./stripe trigger`
- Check API logs for webhook processing
- Look at the database file to see if payments are stored

## 🎉 Success!

Once you see test payments in the customer portal with subscription verification status, your Stripe webhook system is working correctly!

The system will now:
- ✅ Capture real payments via webhooks
- ✅ Verify subscription status for each payment
- ✅ Display payment history to customers
- ✅ Show next payment dates and subscription plans
- ✅ Identify orphaned payments (payments without active subscriptions)
