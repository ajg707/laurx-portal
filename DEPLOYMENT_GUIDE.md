# LAURx Portal Deployment Guide

## Overview
This guide will help you deploy the LAURx customer portal with email-based MFA authentication and Stripe integration.

## Prerequisites
- Node.js 18+ installed
- A domain or subdomain for your API (e.g., api.mylaurelrose.com)
- SMTP email service (Gmail, SendGrid, etc.)
- Stripe account with API keys
- Squarespace website access

## Step 1: API Deployment

### 1.1 Environment Setup
Create `apps/api/.env` file with your production values:

```env
# Server Configuration
PORT=3001
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-here

# CORS Configuration
CORS_ORIGIN=https://mylaurelrose.com,https://www.mylaurelrose.com

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=LAURx Portal <noreply@mylaurelrose.com>

# Database (if using one later)
# DATABASE_URL=your-database-connection-string
```

### 1.2 Install Dependencies
```bash
cd apps/api
npm install
```

### 1.3 Build and Start
```bash
npm run build
npm start
```

### 1.4 Deploy to Server
Deploy to your preferred hosting service (Heroku, DigitalOcean, AWS, etc.):

**For Heroku:**
```bash
# Install Heroku CLI, then:
heroku create laurx-portal-api
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set STRIPE_SECRET_KEY=sk_live_...
# ... set all other environment variables
git subtree push --prefix apps/api heroku main
```

## Step 2: Frontend Deployment

### 2.1 Environment Setup
Create `apps/portal/.env` file:

```env
VITE_API_URL=https://your-api-domain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51P1tHsFic1JmOrK9...
```

### 2.2 Install Dependencies
```bash
cd apps/portal
npm install
```

### 2.3 Build for Production
```bash
npm run build
```

### 2.4 Deploy Frontend
Upload the `dist` folder contents to your web hosting or CDN.

**For Netlify:**
```bash
# Install Netlify CLI, then:
netlify deploy --prod --dir=dist
```

## Step 3: Squarespace Integration

### 3.1 Add Portal to Squarespace

1. **Go to your Squarespace admin panel**
2. **Navigate to Settings > Advanced > Code Injection**
3. **Add this code to the Header:**

```html
<!-- LAURx Portal Integration -->
<style>
  .laurx-portal-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .laurx-portal-trigger {
    background: linear-gradient(135deg, #059669, #047857);
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .laurx-portal-trigger:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
  }
  
  .laurx-portal-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
  }
  
  .laurx-portal-modal.active {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .laurx-portal-frame {
    width: 90%;
    max-width: 1200px;
    height: 90%;
    border: none;
    border-radius: 12px;
    background: white;
  }
  
  .laurx-portal-close {
    position: absolute;
    top: 20px;
    right: 20px;
    background: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 20px;
    font-weight: bold;
    color: #666;
  }
</style>
```

4. **Add this code to the Footer:**

```html
<!-- LAURx Portal JavaScript -->
<script>
(function() {
  // Create portal modal
  const modal = document.createElement('div');
  modal.className = 'laurx-portal-modal';
  modal.innerHTML = `
    <button class="laurx-portal-close" onclick="closeLaurxPortal()">&times;</button>
    <iframe class="laurx-portal-frame" src="https://your-portal-domain.com"></iframe>
  `;
  document.body.appendChild(modal);
  
  // Portal functions
  window.openLaurxPortal = function() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  
  window.closeLaurxPortal = function() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };
  
  // Close on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeLaurxPortal();
    }
  });
  
  // Close on backdrop click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeLaurxPortal();
    }
  });
})();
</script>
```

### 3.2 Add Portal Button to Pages

On any page where you want the portal access, add a Code Block with:

```html
<div class="laurx-portal-container">
  <button class="laurx-portal-trigger" onclick="openLaurxPortal()">
    🔐 Access Your Account Portal
  </button>
  <p style="margin-top: 10px; color: #666; font-size: 14px;">
    Manage your subscriptions, payment methods, and account settings
  </p>
</div>
```

## Step 4: Stripe Configuration

### 4.1 Webhook Setup
1. Go to your Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-api-domain.com/api/stripe/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to your API environment variables

### 4.2 Customer Portal Settings
1. Go to Stripe Dashboard > Settings > Billing > Customer Portal
2. Enable the customer portal
3. Configure allowed actions (cancel subscriptions, update payment methods, etc.)

## Step 5: Email Configuration

### 5.1 Gmail Setup (if using Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"
3. Use this app password in your `EMAIL_PASS` environment variable

### 5.2 SendGrid Setup (alternative)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

## Step 6: Testing

### 6.1 Test Email Authentication
1. Visit your portal
2. Enter a test email address
3. Check that verification codes are received
4. Verify login works

### 6.2 Test Stripe Integration
1. Use Stripe test mode initially
2. Test subscription creation/cancellation
3. Verify webhook events are received

### 6.3 Test Squarespace Integration
1. Visit your Squarespace site
2. Click the portal button
3. Verify the modal opens correctly
4. Test the full authentication flow

## Step 7: Go Live

### 7.1 Switch to Production
1. Update all environment variables to production values
2. Use live Stripe keys
3. Update CORS origins to production domains
4. Test thoroughly in production environment

### 7.2 Monitor
- Set up error monitoring (Sentry, LogRocket, etc.)
- Monitor API logs
- Track user authentication success rates
- Monitor Stripe webhook delivery

## Security Checklist

- [ ] JWT secret is secure and random
- [ ] CORS origins are properly configured
- [ ] HTTPS is enabled on all domains
- [ ] Email credentials are secure
- [ ] Stripe webhook secrets are configured
- [ ] Rate limiting is enabled
- [ ] Input validation is in place

## Support

For issues with deployment:
1. Check server logs for API errors
2. Verify all environment variables are set
3. Test Stripe webhook delivery in dashboard
4. Confirm email service is working
5. Check browser console for frontend errors

## Maintenance

### Regular Tasks
- Monitor server performance
- Update dependencies monthly
- Review security logs
- Backup customer data
- Test disaster recovery procedures

### Scaling Considerations
- Add database for user preferences
- Implement caching (Redis)
- Add monitoring and alerting
- Consider CDN for frontend assets
- Plan for increased email volume
