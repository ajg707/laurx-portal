"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSessionActivity = exports.isSessionExpired = exports.createSession = exports.validateJWTPayload = exports.createRateLimiter = exports.maskEmail = exports.sanitizeEmail = exports.isValidEmail = exports.generateSecureToken = exports.comparePassword = exports.hashPassword = exports.generateVerificationCode = void 0;
const crypto = __importStar(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateVerificationCode = generateVerificationCode;
const hashPassword = async (password) => {
    const saltRounds = 12;
    return bcryptjs_1.default.hash(password, saltRounds);
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hash) => {
    return bcryptjs_1.default.compare(password, hash);
};
exports.comparePassword = comparePassword;
const generateSecureToken = () => {
    return crypto.randomBytes(32).toString('hex');
};
exports.generateSecureToken = generateSecureToken;
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const sanitizeEmail = (email) => {
    return email.toLowerCase().trim();
};
exports.sanitizeEmail = sanitizeEmail;
const maskEmail = (email) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
        return `${localPart[0]}***@${domain}`;
    }
    return `${localPart.substring(0, 2)}***@${domain}`;
};
exports.maskEmail = maskEmail;
const createRateLimiter = () => {
    const attempts = new Map();
    return {
        isAllowed: (key, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
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
        reset: (key) => {
            attempts.delete(key);
        },
        cleanup: () => {
            const now = Date.now();
            for (const [key, record] of attempts.entries()) {
                if (now > record.resetTime) {
                    attempts.delete(key);
                }
            }
        }
    };
};
exports.createRateLimiter = createRateLimiter;
const validateJWTPayload = (payload) => {
    return (payload &&
        typeof payload.email === 'string' &&
        typeof payload.type === 'string' &&
        payload.type === 'customer' &&
        (0, exports.isValidEmail)(payload.email));
};
exports.validateJWTPayload = validateJWTPayload;
const createSession = (email, ipAddress, userAgent) => {
    return {
        email: (0, exports.sanitizeEmail)(email),
        lastActivity: new Date(),
        ipAddress,
        userAgent
    };
};
exports.createSession = createSession;
const isSessionExpired = (session, maxAgeMs = 24 * 60 * 60 * 1000) => {
    const now = new Date();
    return (now.getTime() - session.lastActivity.getTime()) > maxAgeMs;
};
exports.isSessionExpired = isSessionExpired;
const updateSessionActivity = (session) => {
    session.lastActivity = new Date();
};
exports.updateSessionActivity = updateSessionActivity;
//# sourceMappingURL=auth.js.map