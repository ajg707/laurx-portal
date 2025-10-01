export interface CustomerGroup {
    id: string;
    name: string;
    description: string;
    type: 'static' | 'dynamic';
    customerIds?: string[];
    criteria?: GroupCriteria;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}
export interface GroupCriteria {
    minTotalSpent?: number;
    maxTotalSpent?: number;
    status?: ('active' | 'inactive' | 'churned')[];
    createdAfter?: string;
    createdBefore?: string;
    lastOrderAfter?: string;
    lastOrderBefore?: string;
    hasActiveSubscription?: boolean;
    hasAnySubscription?: boolean;
    minOrders?: number;
    maxOrders?: number;
}
export declare function createGroup(group: Omit<CustomerGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerGroup>;
export declare function getGroup(groupId: string): Promise<CustomerGroup | null>;
export declare function getAllGroups(): Promise<CustomerGroup[]>;
export declare function updateGroup(groupId: string, updates: Partial<CustomerGroup>): Promise<void>;
export declare function deleteGroup(groupId: string): Promise<void>;
export declare function addCustomersToGroup(groupId: string, customerIds: string[]): Promise<void>;
export declare function removeCustomersFromGroup(groupId: string, customerIds: string[]): Promise<void>;
export declare function getGroupCustomers(groupId: string): Promise<string[]>;
//# sourceMappingURL=customerGroups.d.ts.map