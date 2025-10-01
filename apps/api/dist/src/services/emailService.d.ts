export declare const sendVerificationEmail: (email: string, code: string) => Promise<void>;
export declare const sendEmail: (options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
}) => Promise<void>;
export declare const sendWelcomeEmail: (email: string) => Promise<void>;
//# sourceMappingURL=emailService.d.ts.map