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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGroup = createGroup;
exports.getGroup = getGroup;
exports.getAllGroups = getAllGroups;
exports.updateGroup = updateGroup;
exports.deleteGroup = deleteGroup;
exports.addCustomersToGroup = addCustomersToGroup;
exports.removeCustomersFromGroup = removeCustomersFromGroup;
exports.getGroupCustomers = getGroupCustomers;
const firestore_1 = require("./firestore");
async function createGroup(group) {
    const docRef = firestore_1.db.collection(firestore_1.Collections.CUSTOMER_GROUPS).doc();
    const newGroup = {
        ...group,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    await docRef.set(newGroup);
    return newGroup;
}
async function getGroup(groupId) {
    const doc = await firestore_1.db.collection(firestore_1.Collections.CUSTOMER_GROUPS).doc(groupId).get();
    if (!doc.exists) {
        return null;
    }
    return doc.data();
}
async function getAllGroups() {
    const snapshot = await firestore_1.db.collection(firestore_1.Collections.CUSTOMER_GROUPS).get();
    return snapshot.docs.map(doc => doc.data());
}
async function updateGroup(groupId, updates) {
    await firestore_1.db.collection(firestore_1.Collections.CUSTOMER_GROUPS).doc(groupId).update({
        ...updates,
        updatedAt: new Date().toISOString()
    });
}
async function deleteGroup(groupId) {
    await firestore_1.db.collection(firestore_1.Collections.CUSTOMER_GROUPS).doc(groupId).delete();
}
async function addCustomersToGroup(groupId, customerIds) {
    const group = await getGroup(groupId);
    if (!group || group.type !== 'static') {
        throw new Error('Group not found or is not a static group');
    }
    const existingIds = new Set(group.customerIds || []);
    customerIds.forEach(id => existingIds.add(id));
    await updateGroup(groupId, {
        customerIds: Array.from(existingIds)
    });
}
async function removeCustomersFromGroup(groupId, customerIds) {
    const group = await getGroup(groupId);
    if (!group || group.type !== 'static') {
        throw new Error('Group not found or is not a static group');
    }
    const removeSet = new Set(customerIds);
    const updatedIds = (group.customerIds || []).filter(id => !removeSet.has(id));
    await updateGroup(groupId, {
        customerIds: updatedIds
    });
}
async function getGroupCustomers(groupId) {
    const group = await getGroup(groupId);
    if (!group) {
        return [];
    }
    if (group.type === 'static') {
        return group.customerIds || [];
    }
    return await evaluateDynamicGroup(group.criteria);
}
async function evaluateDynamicGroup(criteria) {
    const { getCustomersFromCache, getSubscriptionsFromCache, getInvoicesFromCache, getChargesFromCache } = await Promise.resolve().then(() => __importStar(require('./firestore')));
    const [customers, subscriptions, invoices, charges] = await Promise.all([
        getCustomersFromCache(),
        getSubscriptionsFromCache(),
        getInvoicesFromCache(),
        getChargesFromCache()
    ]);
    const subscriptionsByCustomer = new Map();
    subscriptions.forEach(sub => {
        const customerId = sub.customerId;
        if (customerId) {
            const existing = subscriptionsByCustomer.get(customerId) || [];
            existing.push(sub);
            subscriptionsByCustomer.set(customerId, existing);
        }
    });
    const invoicesByCustomer = new Map();
    invoices.forEach(inv => {
        const customerId = inv.customerId;
        if (customerId) {
            const existing = invoicesByCustomer.get(customerId) || [];
            existing.push(inv);
            invoicesByCustomer.set(customerId, existing);
        }
    });
    const chargesByCustomer = new Map();
    charges.forEach(charge => {
        const customerId = charge.customerId;
        if (customerId) {
            const existing = chargesByCustomer.get(customerId) || [];
            existing.push(charge);
            chargesByCustomer.set(customerId, existing);
        }
    });
    const matchingCustomers = customers.filter(customer => {
        const customerId = customer.stripeId || customer.id;
        const customerSubs = subscriptionsByCustomer.get(customerId) || [];
        const customerInvoices = invoicesByCustomer.get(customerId) || [];
        const customerCharges = chargesByCustomer.get(customerId) || [];
        const invoiceTotal = customerInvoices
            .filter(inv => inv.status === 'paid' && inv.amountPaid)
            .reduce((sum, invoice) => sum + invoice.amountPaid, 0);
        const chargeTotal = customerCharges
            .filter(charge => charge.status === 'succeeded')
            .reduce((sum, charge) => sum + charge.amount, 0);
        const totalSpent = (invoiceTotal + chargeTotal) / 100;
        if (criteria.minTotalSpent !== undefined && totalSpent < criteria.minTotalSpent) {
            return false;
        }
        if (criteria.maxTotalSpent !== undefined && totalSpent > criteria.maxTotalSpent) {
            return false;
        }
        const hasActiveSubscription = customerSubs.some(sub => ['active', 'trialing', 'past_due'].includes(sub.status));
        const status = hasActiveSubscription ? 'active' :
            customerSubs.length > 0 ? 'inactive' : 'churned';
        if (criteria.status && !criteria.status.includes(status)) {
            return false;
        }
        if (criteria.hasActiveSubscription !== undefined) {
            if (criteria.hasActiveSubscription !== hasActiveSubscription) {
                return false;
            }
        }
        if (criteria.hasAnySubscription !== undefined) {
            if (criteria.hasAnySubscription !== (customerSubs.length > 0)) {
                return false;
            }
        }
        const createdDate = new Date(customer.created * 1000);
        if (criteria.createdAfter && createdDate < new Date(criteria.createdAfter)) {
            return false;
        }
        if (criteria.createdBefore && createdDate > new Date(criteria.createdBefore)) {
            return false;
        }
        const orderCount = customerInvoices.length + customerCharges.length;
        if (criteria.minOrders !== undefined && orderCount < criteria.minOrders) {
            return false;
        }
        if (criteria.maxOrders !== undefined && orderCount > criteria.maxOrders) {
            return false;
        }
        return true;
    });
    return matchingCustomers.map(c => c.stripeId || c.id);
}
//# sourceMappingURL=customerGroups.js.map