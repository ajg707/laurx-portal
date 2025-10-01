# LAURx Portal - Complete Email Setup Guide

## 🎯 Overview

This guide provides comprehensive instructions for setting up email functionality in the LAURx Portal system. The system supports multiple email providers and includes advanced configuration validation and testing tools.

## 📋 Quick Start Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Choose your email provider
- [ ] Configure provider credentials
- [ ] Test email configuration
- [ ] Verify email sending works

## 🔧 Step 1: Environment Setup

### Copy Configuration Template

```bash
cd apps/api
cp .env.example .env
```

### Edit Your Configuration

Open `apps/api/.env` and configure the following sections:

## 📧 Step 2: Choose Your Email Provider

### Option A: Gmail SMTP (Easiest for Development)

**Pros:** Free, easy to set up, reliable for low volume
**Cons:** Daily sending limits, requires app passwords

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_16_character_app_password
FROM_EMAIL=your-email@gmail.com
```

#### Gmail Setup Steps:
1. **Enable 2-Factor Authentication**: https://myaccount.google.com/security
2. **Generate App Password**: 
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (custom name)"
   - Name it "LAURx Portal"
   - Copy the 16-character password (remove spaces)
3. **Use App Password**: Paste the 16-character password as `SMTP_PASS`

### Option B: SendGrid (Recommended for Production)

**Pros:** High deliverability, detailed analytics, scalable
**Cons:** Requires account setup, paid service for high volume

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com
```

#### SendGrid Setup Steps:
1. **Sign up**: https://sendgrid.com/
2. **Create API Key**: Settings → API Keys → Create API Key
3. **Choose permissions**: Mail Send (Full Access)
4. **Verify domain**: Sender Authentication → Domain Authentication

### Option C: Mailchimp Transactional (Mandrill)

**Pros:** Good deliverability, integrated with Mailchimp
**Cons:** Requires Mailchimp account, more complex setup

```bash
EMAIL_PROVIDER=mailchimp
MAILCHIMP_API_KEY=md-your_mailchimp_transactional_key
FROM_EMAIL=noreply@yourdomain.com
```

#### Mailchimp Setup Steps:
1. **Sign up**: https://mailchimp.com/
2. **Enable Transactional**: Add-ons → Transactional Email
3. **Get API Key**: Transactional → Settings → SMTP & API Info

### Option D: Mailgun

**Pros:** Developer-friendly, powerful API, good pricing
**Cons:** Requires domain verification

```bash
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=mg.yourdomain.com
FROM_EMAIL=noreply@yourdomain.com
```

#### Mailgun Setup Steps:
1. **Sign up**: https://mailgun.com/
2. **Add domain**: Domains → Add New Domain
3. **Verify domain**: Follow DNS setup instructions
4. **Get API Key**: Settings → API Keys

## 🔐 Step 3: Security Configuration

### JWT Secret
Generate a secure random string (at least 32 characters):

```bash
# Generate using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use a password generator
JWT_SECRET=your_super_secure_random_string_at_least_32_characters_long
```

### Stripe Configuration
```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## 🧪 Step 4: Test Your Configuration

### Start the API Server
```bash
cd apps/api
npm run dev
```

### Check Configuration Status
The server will automatically display email configuration status on startup:

```
📧 EMAIL CONFIGURATION STATUS:
Provider: smtp
Configured: ✅ Yes

💡 Recommendations:
  - For Gmail: Enable 2FA and use App Passwords
  - For production: Consider using a dedicated email service
```

### Test Email Sending

#### Option 1: Use Admin Panel
1. Open admin panel: http://localhost:3002
2. Login with admin credentials
3. Go to Settings → Email Configuration
4. Click "Send Test Email"

#### Option 2: Use API Directly
```bash
# Test verification email
curl -X POST http://localhost:3001/api/auth/request-code \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'

# Test admin email configuration (requires admin token)
curl -X POST http://localhost:3001/api/admin/email-config/send-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"email":"your-test-email@example.com"}'
```

## 🔍 Step 5: Advanced Configuration

### Debug Mode
Enable detailed logging:
```bash
DEBUG_EMAIL=true
```

### Dry Run Mode
Test without sending actual emails:
```bash
EMAIL_DRY_RUN=true
```

### Custom SMTP Settings
For other SMTP providers:
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587  # or 465 for SSL
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_smtp_password
FROM_EMAIL=noreply@yourdomain.com
```

## 🚨 Troubleshooting

### Common Issues

#### "Invalid login: 535-5.7.8 Username and Password not accepted"
- **Gmail**: Use App Password, not regular password
- **Other providers**: Check username/password combination
- **Solution**: Verify credentials and enable 2FA for Gmail

#### "Connection timeout" or "ECONNREFUSED"
- **Issue**: Network/firewall blocking SMTP ports
- **Solution**: Check firewall settings, try different ports (587, 465, 25)

#### "FROM_EMAIL is required"
- **Issue**: Missing or invalid FROM_EMAIL configuration
- **Solution**: Set a valid email address in FROM_EMAIL

#### Emails going to spam
- **Issue**: Poor sender reputation or missing authentication
- **Solution**: 
  - Use a dedicated email service (SendGrid, Mailgun)
  - Set up SPF, DKIM, and DMARC records
  - Use a verified domain

### Validation Commands

Check configuration without sending emails:
```bash
curl -X POST http://localhost:3001/api/admin/email-config/validate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Test SMTP connection:
```bash
curl -X POST http://localhost:3001/api/admin/email-config/test-smtp \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📊 Monitoring and Analytics

### Email Logs
Monitor email sending in the console output:
```
✅ Email sent via SMTP to user@example.com
❌ Failed to send email to user@example.com: Invalid login
```

### Provider-Specific Analytics
- **SendGrid**: Dashboard → Activity → Email Activity
- **Mailgun**: Dashboard → Analytics
- **Mailchimp**: Reports → Transactional

## 🔄 Production Deployment

### Environment Variables
Ensure these are set in your production environment:
- `EMAIL_PROVIDER`
- Provider-specific credentials
- `FROM_EMAIL`
- `JWT_SECRET`

### Security Best Practices
1. **Never commit `.env` files** to version control
2. **Use environment-specific configurations**
3. **Rotate API keys regularly**
4. **Monitor email sending quotas**
5. **Set up proper DNS records** (SPF, DKIM, DMARC)

### Scaling Considerations
- **SendGrid**: Up to 100 emails/day free, then paid plans
- **Mailgun**: 5,000 emails/month free, then $0.80/1000 emails
- **Gmail**: 500 emails/day limit
- **Mailchimp**: Based on your Mailchimp plan

## 📞 Support

### Getting Help
1. **Check logs**: Look for detailed error messages in console
2. **Validate configuration**: Use built-in validation endpoints
3. **Test step by step**: Start with SMTP connection test
4. **Provider documentation**: Check your email provider's docs

### Common Provider Support Links
- **Gmail**: https://support.google.com/accounts/answer/185833
- **SendGrid**: https://docs.sendgrid.com/
- **Mailgun**: https://documentation.mailgun.com/
- **Mailchimp**: https://mailchimp.com/developer/transactional/

## ✅ Success Checklist

- [ ] Email provider configured
- [ ] Credentials validated
- [ ] Test email sent successfully
- [ ] Verification codes working
- [ ] Admin notifications working
- [ ] Production environment configured
- [ ] Monitoring set up

---

**🎉 Congratulations!** Your LAURx Portal email system is now fully configured and ready for production use.
