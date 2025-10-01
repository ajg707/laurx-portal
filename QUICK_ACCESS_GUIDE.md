# 🚀 Quick Access Guide - LAURx Portals

## Current Status
✅ **API Server**: Running on http://localhost:3001  
✅ **Stripe Integration**: Configured and ready  
⚠️ **Email**: Gmail authentication needs updating (can be fixed later)

## 🔐 How to Access the Portals

### 1. Customer Portal
**URL**: http://localhost:3000 (after starting)

**Start Command**:
```bash
cd apps/portal
npm run dev
```

**Login**:
- Email: Any email (e.g., `customer@example.com`)
- Code: Any 6-digit code (e.g., `123456`)

**Features**:
- Dashboard
- Subscriptions
- Payment Methods  
- **Payment History** (NEW - shows Stripe webhook tracking)
- Support

### 2. Admin Portal  
**URL**: http://localhost:3002 (after starting)

**Start Command**:
```bash
cd apps/admin
npm run dev
```

**Login**:
- Email: `mglynn@mylaurelrose.com` (or any admin email)
- Code: Any 6-digit code (e.g., `123456`)

**Features**:
- Dashboard with analytics
- Customer management
- Email campaigns
- Automation rules
- Coupons
- Analytics

## 🎯 Testing the New Stripe Webhook System

### Optional: Test Stripe Webhooks
If you want to see the new payment tracking in action:

```bash
# Terminal 4 - Start webhook forwarding
./stripe listen --forward-to localhost:3001/api/stripe/webhook

# Terminal 5 - Trigger test payments  
./stripe trigger payment_intent.succeeded
./stripe trigger invoice.payment_succeeded
```

Then check the **Payment History** page in the customer portal!

## 📱 Quick Start Steps

1. **API is already running** ✅
2. **Start Customer Portal**:
   ```bash
   cd apps/portal && npm run dev
   ```
3. **Start Admin Portal** (optional):
   ```bash
   cd apps/admin && npm run dev
   ```
4. **Access portals** at the URLs above
5. **Login** with any email and code `123456`

## 🎉 What's New

The **Payment History** page now shows:
- Payment summary cards (Total Paid, Active Subscriptions, etc.)
- Detailed payment table with subscription verification
- Status badges showing if payments have active subscriptions  
- Next payment dates for subscriptions
- Manual verification buttons

This is where the Stripe webhook payment tracking magic happens! 🪄
