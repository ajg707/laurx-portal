const nodemailer = require('nodemailer');
require('dotenv').config({ path: './.env' });

async function testEmailDirect() {
  console.log('🧪 Testing email service directly...');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: 'mglynn@mylaurelrose.com',
    subject: 'Test Email - Direct',
    text: 'This is a direct test of the email service.',
    html: '<p>This is a direct test of the email service.</p>'
  };

  try {
    console.log('📧 Attempting to send email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

testEmailDirect()
  .then(() => {
    console.log('🎉 Direct email test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Direct email test failed:', error.message);
    process.exit(1);
  });
