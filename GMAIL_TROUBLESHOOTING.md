# Gmail SMTP Authentication Troubleshooting

## Current Issue
Gmail is rejecting the app password with error:
```
535-5.7.8 Username and Password not accepted
```

## Resolution Steps

### 1. Verify Gmail Account Settings
- Ensure 2-Factor Authentication is **enabled** on support@mylaurelrose.com
- App passwords only work with 2FA enabled

### 2. Generate New App Password
1. Go to Google Account settings: https://myaccount.google.com/
2. Navigate to Security → 2-Step Verification → App passwords
3. Generate a new app password for "Mail"
4. Copy the 16-character password (no spaces)

### 3. Update Environment Variables
Replace the current SMTP_PASS in `/apps/api/.env`:
```
SMTP_PASS=your_new_16_character_app_password
```

### 4. Alternative Email Providers
If Gmail continues to have issues, consider:

**SendGrid (Recommended for Production)**
```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=support@mylaurelrose.com
```

**Mailgun**
```
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_domain
FROM_EMAIL=support@mylaurelrose.com
```

**AWS SES**
```
EMAIL_PROVIDER=ses
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
FROM_EMAIL=support@mylaurelrose.com
```

### 5. Testing
After updating credentials, restart the API server and test:
```bash
cd apps/api
npm run dev
```

Then test with:
```bash
node test_email_admin.js
```

## Current System Status
- ✅ Email service architecture implemented
- ✅ Multi-provider support ready
- ✅ Error handling and validation complete
- ❌ Gmail credentials need resolution
