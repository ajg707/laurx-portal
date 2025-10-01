export declare const paymentTracker: {
    trackPayment: (data: any) => Promise<void>;
    getPaymentsByEmail: (email: string) => Promise<any[]>;
    verifyPaymentSubscriptionStatus: (email: string) => Promise<{
        hasActiveSubscription: boolean;
    }>;
    storeWebhookPayment: (data: any) => Promise<void>;
};
export default paymentTracker;
//# sourceMappingURL=paymentTracker.d.ts.map