"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const joi_1 = __importDefault(require("joi"));
const emailService_1 = require("../services/emailService");
const auth_1 = require("../utils/auth");
const router = express_1.default.Router();
exports.authRoutes = router;
const verificationCodes = new Map();
const authenticatedUsers = new Map();
const emailSchema = joi_1.default.object({
    email: joi_1.default.string().email().required()
});
const verifySchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    code: joi_1.default.string().length(6).required()
});
router.post('/request-code', async (req, res) => {
    try {
        const { error, value } = emailSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { email } = value;
        const code = (0, auth_1.generateVerificationCode)();
        const expires = new Date(Date.now() + 10 * 60 * 1000);
        verificationCodes.set(email, { code, expires, attempts: 0 });
        await (0, emailService_1.sendVerificationEmail)(email, code);
        console.log(`Verification code sent to ${email}: ${code}`);
        res.json({
            message: 'Verification code sent to your email',
            email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        });
    }
    catch (error) {
        console.error('Error sending verification code:', error);
        res.status(500).json({ error: 'Failed to send verification code' });
    }
});
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
        if (new Date() > storedData.expires) {
            verificationCodes.delete(email);
            return res.status(400).json({ error: 'Verification code has expired' });
        }
        if (storedData.attempts >= 3) {
            verificationCodes.delete(email);
            return res.status(429).json({ error: 'Too many failed attempts. Please request a new code.' });
        }
        if (storedData.code !== code) {
            storedData.attempts++;
            return res.status(400).json({ error: 'Invalid verification code' });
        }
        const token = jsonwebtoken_1.default.sign({ email, type: 'customer' }, process.env.JWT_SECRET, { expiresIn: '24h' });
        verificationCodes.delete(email);
        authenticatedUsers.set(email, { email, lastActivity: new Date() });
        res.json({
            message: 'Authentication successful',
            token,
            user: { email }
        });
    }
    catch (error) {
        console.error('Error verifying code:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});
router.post('/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            authenticatedUsers.delete(decoded.email);
        }
        catch (error) {
        }
    }
    res.json({ message: 'Logged out successfully' });
});
router.get('/verify-token', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = authenticatedUsers.get(decoded.email);
        if (!user) {
            return res.status(401).json({ error: 'Session expired' });
        }
        user.lastActivity = new Date();
        res.json({
            valid: true,
            user: { email: decoded.email }
        });
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});
setInterval(() => {
    const now = new Date();
    const expiredThreshold = 24 * 60 * 60 * 1000;
    for (const [email, userData] of authenticatedUsers.entries()) {
        if (now.getTime() - userData.lastActivity.getTime() > expiredThreshold) {
            authenticatedUsers.delete(email);
        }
    }
    for (const [email, codeData] of verificationCodes.entries()) {
        if (now > codeData.expires) {
            verificationCodes.delete(email);
        }
    }
}, 60 * 60 * 1000);
//# sourceMappingURL=auth.js.map