export declare const generateVerificationCode: () => string;
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
export declare const generateSecureToken: () => string;
export declare const isValidEmail: (email: string) => boolean;
export declare const sanitizeEmail: (email: string) => string;
export declare const maskEmail: (email: string) => string;
export declare const createRateLimiter: () => {
    isAllowed: (key: string, maxAttempts?: number, windowMs?: number) => boolean;
    reset: (key: string) => void;
    cleanup: () => void;
};
export declare const validateJWTPayload: (payload: any) => boolean;
export interface UserSession {
    email: string;
    lastActivity: Date;
    ipAddress?: string;
    userAgent?: string;
}
export declare const createSession: (email: string, ipAddress?: string, userAgent?: string) => UserSession;
export declare const isSessionExpired: (session: UserSession, maxAgeMs?: number) => boolean;
export declare const updateSessionActivity: (session: UserSession) => void;
//# sourceMappingURL=auth.d.ts.map