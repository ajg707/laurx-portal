import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const generateVerificationCode = (): string => {
  // Generate a 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart.substring(0, 2)}***@${domain}`;
};

// Rate limiting helper
export const createRateLimiter = () => {
  const attempts = new Map<string, { count: number; resetTime: number }>();
  
  return {
    isAllowed: (key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
      const now = Date.now();
      const record = attempts.get(key);
      
      if (!record || now > record.resetTime) {
        attempts.set(key, { count: 1, resetTime: now + windowMs });
        return true;
      }
      
      if (record.count >= maxAttempts) {
        return false;
      }
      
      record.count++;
      return true;
    },
    
    reset: (key: string): void => {
      attempts.delete(key);
    },
    
    cleanup: (): void => {
      const now = Date.now();
      for (const [key, record] of attempts.entries()) {
        if (now > record.resetTime) {
          attempts.delete(key);
        }
      }
    }
  };
};

// JWT token validation helper
export const validateJWTPayload = (payload: any): boolean => {
  return (
    payload &&
    typeof payload.email === 'string' &&
    typeof payload.type === 'string' &&
    payload.type === 'customer' &&
    isValidEmail(payload.email)
  );
};

// Session management
export interface UserSession {
  email: string;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
}

export const createSession = (email: string, ipAddress?: string, userAgent?: string): UserSession => {
  return {
    email: sanitizeEmail(email),
    lastActivity: new Date(),
    ipAddress,
    userAgent
  };
};

export const isSessionExpired = (session: UserSession, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean => {
  const now = new Date();
  return (now.getTime() - session.lastActivity.getTime()) > maxAgeMs;
};

export const updateSessionActivity = (session: UserSession): void => {
  session.lastActivity = new Date();
};
