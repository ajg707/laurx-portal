# Stripe Webhook System Testing Checklist

## 🎯 Critical Path Testing

### Step 1: Start All Services

#### Terminal 1: API Server
```bash
cd apps/api
npm run dev
```
Expected: Server starts on port 3001

#### Terminal 2: Stripe Webhook Forwarding
```bash
./stripe listen --forward-to localhost:3001/api/stripe/webhook
```
Expected: Shows webhook signing secret like `whsec_...`

#### Terminal 3: Customer Portal
```bash
cd apps/portal
npm run dev
```
Expected: Portal starts on port 3000

### Step 2: Configure Webhook Secret

Copy the webhook secret from Terminal 2 and add to `apps/api/.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### Step 3: Test Webhook Events

#### Test Payment Intent Success
```bash
./stripe trigger payment_intent.succeeded
```

**Expected Results:**
- ✅ Terminal 1 shows: "✅ Webhook signature verified: payment_intent.succeeded"
- ✅ Terminal 1 shows: "💳 Payment succeeded" with payment details
- ✅ Terminal 1 shows: "💾 Stored webhook payment" message
- ✅ File created: `apps/api/data/payment_tracking.json`

#### Test Invoice Payment Success
```bash
./stripe trigger invoice.payment_succeeded
```

**Expected Results:**
- ✅ Terminal 1 shows: "✅ Webhook signature verified: invoice.payment_succeeded"
- ✅ Terminal 1 shows: "📄 Invoice payment succeeded" with details
- ✅ Payment data added to tracking file

### Step 4: Test Customer Portal

1. **Navigate to Portal**: http://localhost:3000
2. **Login**: Use any email (e.g., `test@example.com`)
3. **Enter Code**: Use any 6-digit code for testing
4. **Go to Payment History**: Click "Payment History" in sidebar

**Expected Results:**
- ✅ Payment History page loads without errors
- ✅ Summary cards show payment statistics
- ✅ Payment table shows test payments from webhooks
- ✅ Status badges show verification status
- ✅ "Verify Subscription" buttons work

### Step 5: Test API Endpoints

#### Test Payment Tracking Endpoint
```bash
# Get auth token first by logging into portal, then:
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/stripe/payment-tracking
```

**Expected Results:**
- ✅ Returns JSON with payments array and summary
- ✅ Shows test payments from webhook events

#### Test Payment Verification
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/stripe/payment-tracking/PAYMENT_ID/verify
```

**Expected Results:**
- ✅ Returns updated payment verification status
- ✅ Shows subscription information

## 🔍 Verification Points

### Database File Check
Check `apps/api/data/payment_tracking.json`:
- ✅ File exists and contains payment records
- ✅ Payments have correct structure with all fields
- ✅ Verification status is set appropriately

### Console Logs Check
API server logs should show:
- ✅ Webhook signature verification messages
- ✅ Payment processing messages
- ✅ Subscription verification attempts

### Frontend Functionality
Customer portal should:
- ✅ Load payment history without errors
- ✅ Display payment summary cards correctly
- ✅ Show payment table with proper formatting
- ✅ Handle verification button clicks
- ✅ Update data after verification

## 🚨 Common Issues & Solutions

### Webhook Not Working
- Check API server is running on port 3001
- Verify webhook secret is correct in .env
- Ensure no firewall blocking connections

### Portal Not Loading Data
- Check browser console for errors
- Verify API endpoints are responding
- Confirm authentication token is valid

### Build Errors
- Run `npm install` in each app directory
- Check for TypeScript compilation errors
- Verify all dependencies are installed

## ✅ Success Criteria

The system is working correctly when:
1. **Webhooks Process**: Stripe events are received and processed
2. **Data Storage**: Payment data is stored in tracking database
3. **API Responds**: Payment tracking endpoints return correct data
4. **Portal Displays**: Customer portal shows payment history
5. **Verification Works**: Subscription verification functions properly

## 📝 Test Results Log

- [ ] API Server Started
- [ ] Webhook Forwarding Active
- [ ] Customer Portal Running
- [ ] Webhook Secret Configured
- [ ] Payment Intent Event Processed
- [ ] Invoice Payment Event Processed
- [ ] Payment Database Created
- [ ] Portal Login Works
- [ ] Payment History Displays
- [ ] API Endpoints Respond
- [ ] Verification Buttons Function

**Overall Status: [ ] PASS / [ ] FAIL**
