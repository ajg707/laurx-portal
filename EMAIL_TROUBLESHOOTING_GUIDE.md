# Email System Troubleshooting Guide

## 🚨 Current Issue: Gmail Authentication Failed

**Error**: `535-5.7.8 Username and Password not accepted`

This error indicates that Gmail is rejecting the provided app password. Here are the steps to resolve this:

## 🔧 Gmail App Password Setup (Recommended Solution)

### Step 1: Verify Gmail Account Settings
1. **Enable 2-Factor Authentication**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate New App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" as the app
   - Select "Other (Custom name)" as the device
   - Enter "LAURx Portal" as the name
   - Copy the 16-character password (without spaces)

### Step 2: Update Environment Variables
Replace the current app password in `apps/api/.env`:

```env
# Replace this line:
SMTP_PASS=wjqprnhdufhjqqpd

# With your new app password (example):
SMTP_PASS=abcdabcdabcdabcd
```

### Step 3: Restart the API Server
```bash
cd apps/api
npm run dev
```

## 🔄 Alternative Email Providers

If Gmail continues to fail, here are alternative configurations:

### Option 1: SendGrid (Recommended for Production)
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Update `.env`:

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=support@mylaurelrose.com
```

### Option 2: Mailgun
1. Sign up at [Mailgun](https://www.mailgun.com/)
2. Get your API key and domain
3. Update `.env`:

```env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=your_domain.com
FROM_EMAIL=support@mylaurelrose.com
```

### Option 3: Outlook/Hotmail SMTP
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_outlook_email@outlook.com
SMTP_PASS=your_outlook_password
FROM_EMAIL=your_outlook_email@outlook.com
```

## 🧪 Testing Commands

After updating the configuration, test with:

```bash
# Test admin verification code
node test_email_admin.js

# Or test via API directly
curl -X POST http://localhost:3001/api/admin/auth/request-code \
  -H "Content-Type: application/json" \
  -d '{"email":"mglynn@mylaurelrose.com"}'
```

## 🔍 Debug Mode

Enable detailed logging by adding to `.env`:

```env
EMAIL_DEBUG=true
```

## 📋 Verification Checklist

- [ ] 2FA enabled on Gmail account
- [ ] New app password generated
- [ ] App password copied without spaces
- [ ] Environment variables updated
- [ ] API server restarted
- [ ] Test email sent successfully

## 🆘 If All Else Fails

1. **Use Email Dry Run Mode** (for development):
   ```env
   EMAIL_DRY_RUN=true
   ```
   This will simulate email sending without actually sending emails.

2. **Check Gmail Account Status**:
   - Ensure the account isn't locked or suspended
   - Check for any security alerts in Gmail

3. **Try Different Gmail Account**:
   - Create a new Gmail account specifically for this application
   - Follow the app password setup process

## 📞 Support

If you continue to experience issues:
1. Check the API server logs for detailed error messages
2. Verify all environment variables are correctly set
3. Test with a different email provider
4. Contact your email provider's support if authentication continues to fail

---

**Current Status**: Email system infrastructure is complete and properly configured. Only Gmail authentication needs to be resolved.
