import admin from 'firebase-admin';
export declare const db: admin.firestore.Firestore;
export declare const Collections: {
    CUSTOMERS: string;
    SUBSCRIPTIONS: string;
    INVOICES: string;
    CHARGES: string;
    COUPONS: string;
    WEBHOOK_EVENTS: string;
    CUSTOMER_GROUPS: string;
    EMAIL_CAMPAIGNS: string;
    AUTOMATION_RULES: string;
};
export interface FirestoreCustomer {
    stripeId: string;
    email: string | null;
    name: string | null;
    created: number;
    metadata: Record<string, any>;
    lastUpdated: number;
}
export interface FirestoreSubscription {
    stripeId: string;
    customerId: string;
    status: string;
    currentPeriodEnd: number;
    currentPeriodStart: number;
    cancelAtPeriodEnd: boolean;
    planId: string;
    planAmount: number;
    planInterval: string;
    planNickname: string | null;
    lastUpdated: number;
}
export interface FirestoreInvoice {
    stripeId: string;
    customerId: string;
    status: string;
    amountPaid: number;
    amountDue: number;
    created: number;
    description: string | null;
    hostedInvoiceUrl: string | null;
    charge: string | null;
    lastUpdated: number;
}
export interface FirestoreCharge {
    stripeId: string;
    customerId: string;
    status: string;
    amount: number;
    created: number;
    description: string | null;
    receiptUrl: string | null;
    lastUpdated: number;
}
export declare function saveCustomer(customer: any): Promise<void>;
export declare function saveSubscription(subscription: any): Promise<void>;
export declare function saveInvoice(invoice: any): Promise<void>;
export declare function saveCharge(charge: any): Promise<void>;
export declare function deleteCustomer(customerId: string): Promise<void>;
export declare function deleteSubscription(subscriptionId: string): Promise<void>;
export declare function getCustomersFromCache(): Promise<{
    id: string;
}[]>;
export declare function getSubscriptionsFromCache(customerId?: string): Promise<any>;
export declare function getInvoicesFromCache(customerId?: string): Promise<any>;
export declare function getChargesFromCache(customerId?: string): Promise<any>;
export declare function logWebhookEvent(event: any): Promise<void>;
//# sourceMappingURL=firestore.d.ts.map