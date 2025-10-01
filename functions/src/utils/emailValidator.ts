import nodemailer from 'nodemailer';

export interface EmailConfig {
  provider: string;
  fromEmail: string;
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  mailchimp?: {
    apiKey: string;
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  provider: string;
}

/**
 * Validates email configuration based on the selected provider
 */
export const validateEmailConfig = (): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    provider: process.env.EMAIL_PROVIDER || 'smtp'
  };

  const provider = process.env.EMAIL_PROVIDER || 'smtp';
  const fromEmail = process.env.FROM_EMAIL;

  // Validate FROM_EMAIL
  if (!fromEmail) {
    result.errors.push('FROM_EMAIL is required');
  } else if (!isValidEmail(fromEmail)) {
    result.errors.push('FROM_EMAIL must be a valid email address');
  }

  // Provider-specific validation
  switch (provider.toLowerCase()) {
    case 'smtp':
      validateSMTPConfig(result);
      break;
    case 'mailchimp':
      validateMailchimpConfig(result);
      break;
    case 'sendgrid':
      validateSendGridConfig(result);
      break;
    case 'mailgun':
      validateMailgunConfig(result);
      break;
    default:
      result.errors.push(`Unsupported email provider: ${provider}. Supported providers: smtp, mailchimp, sendgrid, mailgun`);
  }

  result.isValid = result.errors.length === 0;
  return result;
};

/**
 * Validates SMTP configuration
 */
const validateSMTPConfig = (result: ValidationResult): void => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) {
    result.errors.push('SMTP_HOST is required for SMTP provider');
  }

  if (!port) {
    result.warnings.push('SMTP_PORT not set, using default 587');
  } else if (isNaN(parseInt(port))) {
    result.errors.push('SMTP_PORT must be a valid number');
  }

  if (!user) {
    result.errors.push('SMTP_USER is required for SMTP provider');
  } else if (!isValidEmail(user)) {
    result.errors.push('SMTP_USER must be a valid email address');
  }

  if (!pass) {
    result.errors.push('SMTP_PASS is required for SMTP provider');
  } else if (pass.length < 8) {
    result.warnings.push('SMTP_PASS seems short. For Gmail, use a 16-character App Password');
  }

  // Gmail-specific warnings
  if (host === 'smtp.gmail.com' && pass && pass.length !== 16) {
    result.warnings.push('For Gmail, use an App Password (16 characters) instead of your regular password');
  }
};

/**
 * Validates Mailchimp configuration
 */
const validateMailchimpConfig = (result: ValidationResult): void => {
  const apiKey = process.env.MAILCHIMP_API_KEY;

  if (!apiKey) {
    result.errors.push('MAILCHIMP_API_KEY is required for mailchimp provider');
  } else if (!apiKey.startsWith('md-')) {
    result.warnings.push('Mailchimp Transactional API keys typically start with "md-"');
  }
};

/**
 * Validates SendGrid configuration
 */
const validateSendGridConfig = (result: ValidationResult): void => {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    result.errors.push('SENDGRID_API_KEY is required for sendgrid provider');
  } else if (!apiKey.startsWith('SG.')) {
    result.warnings.push('SendGrid API keys typically start with "SG."');
  }
};

/**
 * Validates Mailgun configuration
 */
const validateMailgunConfig = (result: ValidationResult): void => {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey) {
    result.errors.push('MAILGUN_API_KEY is required for mailgun provider');
  }

  if (!domain) {
    result.errors.push('MAILGUN_DOMAIN is required for mailgun provider');
  } else if (!domain.includes('.')) {
    result.errors.push('MAILGUN_DOMAIN must be a valid domain name');
  }
};

/**
 * Tests SMTP connection
 */
export const testSMTPConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Unknown SMTP connection error' 
    };
  }
};

/**
 * Sends a test email to verify configuration
 */
export const sendTestEmail = async (toEmail: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Import the email service dynamically to avoid circular dependencies
    const { sendEmail } = await import('../services/emailService');
    
    const testSubject = 'LAURx Portal - Email Configuration Test';
    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5A96;">✅ Email Configuration Test Successful!</h2>
        <p>This is a test email to verify your LAURx Portal email configuration is working correctly.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong>Configuration Details:</strong><br>
          Provider: ${process.env.EMAIL_PROVIDER || 'smtp'}<br>
          From: ${process.env.FROM_EMAIL}<br>
          Timestamp: ${new Date().toISOString()}
        </div>
        <p>If you received this email, your email service is properly configured and ready to send verification codes and notifications.</p>
        <p style="color: #666; font-size: 14px;">This email was sent from the LAURx Portal admin panel.</p>
      </div>
    `;

    await sendEmail({
      to: toEmail,
      subject: testSubject,
      html: testHtml,
      text: 'LAURx Portal - Email Configuration Test\n\nThis is a test email to verify your email configuration is working correctly.'
    });

    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Unknown error sending test email' 
    };
  }
};

/**
 * Gets email configuration status and recommendations
 */
export const getEmailConfigStatus = () => {
  const validation = validateEmailConfig();
  const provider = process.env.EMAIL_PROVIDER || 'smtp';
  
  const status = {
    provider,
    configured: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
    recommendations: getProviderRecommendations(provider)
  };

  return status;
};

/**
 * Gets provider-specific recommendations
 */
const getProviderRecommendations = (provider: string): string[] => {
  const recommendations: string[] = [];

  switch (provider.toLowerCase()) {
    case 'smtp':
      recommendations.push('For Gmail: Enable 2FA and use App Passwords');
      recommendations.push('For production: Consider using a dedicated email service');
      break;
    case 'mailchimp':
      recommendations.push('Mailchimp Transactional offers good deliverability');
      recommendations.push('Monitor your sending reputation in Mailchimp dashboard');
      break;
    case 'sendgrid':
      recommendations.push('SendGrid is excellent for high-volume sending');
      recommendations.push('Set up domain authentication for better deliverability');
      break;
    case 'mailgun':
      recommendations.push('Mailgun offers powerful API features');
      recommendations.push('Verify your domain for better deliverability');
      break;
  }

  return recommendations;
};

/**
 * Simple email validation
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Logs email configuration status on startup
 */
export const logEmailConfigStatus = (): void => {
  const status = getEmailConfigStatus();
  
  console.log('\n📧 EMAIL CONFIGURATION STATUS:');
  console.log(`Provider: ${status.provider}`);
  console.log(`Configured: ${status.configured ? '✅ Yes' : '❌ No'}`);
  
  if (status.errors.length > 0) {
    console.log('\n❌ Configuration Errors:');
    status.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (status.warnings.length > 0) {
    console.log('\n⚠️  Configuration Warnings:');
    status.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  if (status.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    status.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
  
  console.log('');
};
