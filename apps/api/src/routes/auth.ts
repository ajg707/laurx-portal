import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { sendVerificationEmail } from '../services/emailService';
import { generateVerificationCode } from '../utils/auth';

const router = express.Router();

// In-memory store for verification codes (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: Date; attempts: number }>();
const authenticatedUsers = new Map<string, { email: string; lastActivity: Date }>();

// Validation schemas
const emailSchema = Joi.object({
  email: Joi.string().email().required()
});

const verifySchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required()
});

// Request verification code
router.post('/request-code', async (req, res) => {
  try {
    const { error, value } = emailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email } = value;
    
    // Generate 6-digit verification code
    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store verification code
    verificationCodes.set(email, { code, expires, attempts: 0 });
    
    // Send email
    await sendVerificationEmail(email, code);
    
    console.log(`Verification code sent to ${email}: ${code}`); // Remove in production
    
    res.json({ 
      message: 'Verification code sent to your email',
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email for security
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Verify code and authenticate
router.post('/verify-code', async (req, res) => {
  try {
    const { error, value } = verifySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, code } = value;
    
    const storedData = verificationCodes.get(email);
    if (!storedData) {
      return res.status(400).json({ error: 'No verification code found for this email' });
    }

    // Check if code expired
    if (new Date() > storedData.expires) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Check attempts
    if (storedData.attempts >= 3) {
      verificationCodes.delete(email);
      return res.status(429).json({ error: 'Too many failed attempts. Please request a new code.' });
    }

    // Verify code
    if (storedData.code !== code) {
      storedData.attempts++;
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Code is valid - generate JWT token
    const token = jwt.sign(
      { email, type: 'customer' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Clean up verification code
    verificationCodes.delete(email);
    
    // Store authenticated user
    authenticatedUsers.set(email, { email, lastActivity: new Date() });

    res.json({
      message: 'Authentication successful',
      token,
      user: { email }
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      authenticatedUsers.delete(decoded.email);
    } catch (error) {
      // Token invalid, but we'll still return success
    }
  }
  
  res.json({ message: 'Logged out successfully' });
});

// Verify token (middleware endpoint)
router.get('/verify-token', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user is still in authenticated users
    const user = authenticatedUsers.get(decoded.email);
    if (!user) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Update last activity
    user.lastActivity = new Date();
    
    res.json({ 
      valid: true, 
      user: { email: decoded.email } 
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Clean up expired sessions (run periodically)
setInterval(() => {
  const now = new Date();
  const expiredThreshold = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [email, userData] of authenticatedUsers.entries()) {
    if (now.getTime() - userData.lastActivity.getTime() > expiredThreshold) {
      authenticatedUsers.delete(email);
    }
  }
  
  // Clean up expired verification codes
  for (const [email, codeData] of verificationCodes.entries()) {
    if (now > codeData.expires) {
      verificationCodes.delete(email);
    }
  }
}, 60 * 60 * 1000); // Run every hour

export { router as authRoutes };
