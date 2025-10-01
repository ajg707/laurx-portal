# Stripe Configuration & Hosting Setup Guide

## 🔑 Getting Your Stripe Keys

### 1. STRIPE_PUBLISHABLE_KEY (pk_live_...)

**From your screenshot, I can see you already have this!**

1. Go to your Stripe Dashboard: https://dashboard.stripe.com
2. Click on "Developers" in the left sidebar
3. Click on "API keys"
4. In the "Standard keys" section, you'll see:
   - **Publishable key**: This starts with `pk_live_` (for production)
   - **Secret key**: This starts with `sk_live_` (you already have this)

**From your screenshot, your publishable key appears to be:**
```
pk_live_51P1tHsFic1JmOrK9CLPXweJgLhm09n0Fs...
```

To get the full key:
1. Click the "Reveal live key" button next to "Secret key" 
2. Copy the **Publishable key** (the one that starts with `pk_live_`)

### 2. JWT_SECRET (Generate Your Own)

This is a secret key you create yourself for securing JWT tokens. Here are several ways to generate a secure one:

**Option 1: Use Node.js (Recommended)**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Option 2: Use OpenSSL**
```bash
openssl rand -hex 64
```

**Option 3: Online Generator (Use a reputable one)**
- Go to: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
- Select "Encryption Key"
- Choose 512-bit
- Generate and copy the result

**Example of what it should look like:**
```
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678
```

## 🌐 Hosting Options for Your Portal

Yes, you can absolutely use **any hosting service**! Here are your best options:

### Option 1: Google Cloud Platform (Recommended for you)
Since you already use Google for email, this makes perfect sense:

**Google Cloud Run (Serverless - Easiest)**
- Perfect for Node.js applications
- Automatic scaling
- Pay only for what you use
- Easy SSL/HTTPS setup
- Custom domain support

**Steps:**
1. Enable Google Cloud Run API
2. Install Google Cloud CLI
3. Deploy with: `gcloud run deploy`
4. Set up custom domain: `portal.mylaurelrose.com`

**Google App Engine (Alternative)**
- Also great for Node.js
- Slightly more complex but more features

### Option 2: Vercel (Easiest Overall)
- Perfect for React + Node.js apps
- Free tier available
- Automatic HTTPS
- Easy custom domain setup
- Git integration

### Option 3: Netlify
- Great for static sites + serverless functions
- Free tier available
- Easy custom domain setup

### Option 4: DigitalOcean App Platform
- Simple deployment
- Affordable pricing
- Good for full-stack apps

## 🎯 Recommended Setup for mylaurelrose.com

**Best Option: Google Cloud Run + Custom Domain**

1. **Deploy to Google Cloud Run**
   - Host your portal at: `https://portal.mylaurelrose.com`
   - Automatic HTTPS (required for Stripe)
   - Scales automatically

2. **Domain Setup**
   - Create a subdomain: `portal.mylaurelrose.com`
   - Point it to your Google Cloud Run service
   - Google handles SSL certificates automatically

3. **Integration with Squarespace**
   - Embed the portal using an iframe
   - Or link to it from your main site
   - Or use Squarespace code injection

## 📋 Complete Environment Variables

Create a `.env` file with:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key

# JWT Security
JWT_SECRET=your-generated-64-character-hex-string

# Email Configuration (you already have this working)
EMAIL_USER=mglynn@mylaurelrose.com
EMAIL_PASS=your-google-app-password

# Application Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://portal.mylaurelrose.com
```

## 🚀 Quick Deployment Steps

1. **Get your Stripe publishable key** (from dashboard)
2. **Generate JWT secret** (using one of the methods above)
3. **Choose hosting service** (Google Cloud Run recommended)
4. **Set up custom domain** (`portal.mylaurelrose.com`)
5. **Deploy and test**

Would you like me to create specific deployment instructions for Google Cloud Run or another hosting service?
