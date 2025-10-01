"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const mailchimp_transactional_1 = __importDefault(require("@mailchimp/mailchimp_transactional"));
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'smtp';
console.log('Email Service Debug:');
console.log('EMAIL_PROVIDER:', EMAIL_PROVIDER);
console.log('MAILCHIMP_API_KEY:', process.env.MAILCHIMP_API_KEY ? 'Set' : 'Not set');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
const createTransporter = () => {
    return nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};
const mailchimpClient = process.env.MAILCHIMP_API_KEY
    ? (0, mailchimp_transactional_1.default)(process.env.MAILCHIMP_API_KEY)
    : null;
console.log('Mailchimp client initialized:', mailchimpClient ? 'Yes' : 'No');
const sendEmail = async (to, subject, html, text) => {
    if (EMAIL_PROVIDER === 'mailchimp' && mailchimpClient) {
        const message = {
            html,
            text,
            subject,
            from_email: process.env.FROM_EMAIL || 'noreply@mylaurelrose.com',
            from_name: 'LAURx Portal',
            to: [
                {
                    email: to,
                    type: 'to'
                }
            ],
            important: true,
            track_opens: true,
            track_clicks: true,
            auto_text: true,
            auto_html: false,
            inline_css: true,
            url_strip_qs: false,
            preserve_recipients: false,
            view_content_link: false,
            tracking_domain: null,
            signing_domain: null,
            return_path_domain: null
        };
        const response = await mailchimpClient.messages.send({ message });
        console.log(`Email sent via Mailchimp to ${to}:`, response);
        return response;
    }
    else {
        const transporter = createTransporter();
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'noreply@mylaurelrose.com',
            to,
            subject,
            html,
            text
        };
        const result = await transporter.sendMail(mailOptions);
        console.log(`Email sent via SMTP to ${to}`);
        return result;
    }
};
const sendVerificationEmail = async (email, code) => {
    const subject = 'Your LAURx Portal Verification Code';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LAURx Portal Verification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5A96, #A67BA8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .code-box { background: white; border: 2px solid #8B5A96; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .code { font-size: 32px; font-weight: bold; color: #8B5A96; letter-spacing: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        .brand { font-size: 24px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">LAURx Portal</div>
          <p>Secure Access to Your Account</p>
        </div>
        <div class="content">
          <h2>Verification Code</h2>
          <p>Hello,</p>
          <p>You've requested access to your LAURx customer portal. Please use the verification code below to complete your login:</p>
          
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>This code will expire in 10 minutes</li>
            <li>For security, never share this code with anyone</li>
            <li>If you didn't request this code, please ignore this email</li>
          </ul>
          
          <p>Once logged in, you'll be able to:</p>
          <ul>
            <li>View and manage your subscriptions</li>
            <li>Update payment methods</li>
            <li>View order history and invoices</li>
            <li>Modify delivery preferences</li>
          </ul>
          
          <div class="footer">
            <p>This email was sent from LAURx Portal Security System</p>
            <p>If you have questions, contact us at support@mylaurelrose.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
    const text = `
    LAURx Portal - Verification Code
    
    Hello,
    
    You've requested access to your LAURx customer portal. 
    
    Your verification code is: ${code}
    
    This code will expire in 10 minutes.
    
    Once logged in, you'll be able to manage your subscriptions, update payment methods, and view your order history.
    
    If you didn't request this code, please ignore this email.
    
    Questions? Contact us at support@mylaurelrose.com
  `;
    try {
        await sendEmail(email, subject, html, text);
        console.log(`Verification email sent to ${email}`);
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send verification email');
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendWelcomeEmail = async (email) => {
    const subject = 'Welcome to LAURx Portal';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to LAURx Portal</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5A96, #A67BA8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .brand { font-size: 24px; font-weight: bold; }
        .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #8B5A96; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">Welcome to LAURx Portal</div>
          <p>Your Personal Health Dashboard</p>
        </div>
        <div class="content">
          <h2>You're all set!</h2>
          <p>Welcome to your LAURx customer portal. You now have secure access to manage your immune support journey.</p>
          
          <h3>What you can do in your portal:</h3>
          
          <div class="feature">
            <strong>📦 Manage Subscriptions</strong><br>
            Pause, modify, or cancel your LAURx subscriptions anytime
          </div>
          
          <div class="feature">
            <strong>💳 Payment Methods</strong><br>
            Securely update your payment information and billing details
          </div>
          
          <div class="feature">
            <strong>📋 Order History</strong><br>
            View all your past orders and download invoices
          </div>
          
          <div class="feature">
            <strong>🚚 Delivery Preferences</strong><br>
            Update your shipping address and delivery schedule
          </div>
          
          <p>Questions or need support? We're here to help at support@mylaurelrose.com</p>
          
          <p>Thank you for choosing LAURx for your immune defense!</p>
        </div>
      </div>
    </body>
    </html>
  `;
    const text = `
    Welcome to LAURx Portal
    
    You're all set!
    
    Welcome to your LAURx customer portal. You now have secure access to manage your immune support journey.
    
    What you can do in your portal:
    - Manage Subscriptions: Pause, modify, or cancel your LAURx subscriptions anytime
    - Payment Methods: Securely update your payment information and billing details
    - Order History: View all your past orders and download invoices
    - Delivery Preferences: Update your shipping address and delivery schedule
    
    Questions or need support? We're here to help at support@mylaurelrose.com
    
    Thank you for choosing LAURx for your immune defense!
  `;
    try {
        await sendEmail(email, subject, html, text);
        console.log(`Welcome email sent to ${email}`);
    }
    catch (error) {
        console.error('Error sending welcome email:', error);
    }
};
exports.sendWelcomeEmail = sendWelcomeEmail;
//# sourceMappingURL=emailService.js.map