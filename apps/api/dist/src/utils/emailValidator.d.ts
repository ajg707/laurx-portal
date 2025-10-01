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
export declare const validateEmailConfig: () => ValidationResult;
export declare const testSMTPConnection: () => Promise<{
    success: boolean;
    error?: string;
}>;
export declare const sendTestEmail: (toEmail: string) => Promise<{
    success: boolean;
    error?: string;
}>;
export declare const getEmailConfigStatus: () => {
    provider: string;
    configured: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
};
export declare const logEmailConfigStatus: () => void;
//# sourceMappingURL=emailValidator.d.ts.map