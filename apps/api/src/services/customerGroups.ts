import { db, Collections } from './firestore'

export interface CustomerGroup {
  id: string
  name: string
  description: string
  type: 'static' | 'dynamic'

  // For static groups
  customerIds?: string[]

  // For dynamic groups
  criteria?: GroupCriteria

  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface GroupCriteria {
  // Spending criteria
  minTotalSpent?: number
  maxTotalSpent?: number

  // Status criteria
  status?: ('active' | 'inactive' | 'churned')[]

  // Date criteria
  createdAfter?: string
  createdBefore?: string
  lastOrderAfter?: string
  lastOrderBefore?: string

  // Subscription criteria
  hasActiveSubscription?: boolean
  hasAnySubscription?: boolean

  // Order count criteria
  minOrders?: number
  maxOrders?: number
}

export async function createGroup(group: Omit<CustomerGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerGroup> {
  const docRef = db.collection(Collections.CUSTOMER_GROUPS).doc()

  const newGroup: CustomerGroup = {
    ...group,
    id: docRef.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await docRef.set(newGroup)
  return newGroup
}

export async function getGroup(groupId: string): Promise<CustomerGroup | null> {
  const doc = await db.collection(Collections.CUSTOMER_GROUPS).doc(groupId).get()

  if (!doc.exists) {
    return null
  }

  return doc.data() as CustomerGroup
}

export async function getAllGroups(): Promise<CustomerGroup[]> {
  const snapshot = await db.collection(Collections.CUSTOMER_GROUPS).get()
  return snapshot.docs.map(doc => doc.data() as CustomerGroup)
}

export async function updateGroup(groupId: string, updates: Partial<CustomerGroup>): Promise<void> {
  await db.collection(Collections.CUSTOMER_GROUPS).doc(groupId).update({
    ...updates,
    updatedAt: new Date().toISOString()
  })
}

export async function deleteGroup(groupId: string): Promise<void> {
  await db.collection(Collections.CUSTOMER_GROUPS).doc(groupId).delete()
}

export async function addCustomersToGroup(groupId: string, customerIds: string[]): Promise<void> {
  const group = await getGroup(groupId)

  if (!group || group.type !== 'static') {
    throw new Error('Group not found or is not a static group')
  }

  const existingIds = new Set(group.customerIds || [])
  customerIds.forEach(id => existingIds.add(id))

  await updateGroup(groupId, {
    customerIds: Array.from(existingIds)
  })
}

export async function removeCustomersFromGroup(groupId: string, customerIds: string[]): Promise<void> {
  const group = await getGroup(groupId)

  if (!group || group.type !== 'static') {
    throw new Error('Group not found or is not a static group')
  }

  const removeSet = new Set(customerIds)
  const updatedIds = (group.customerIds || []).filter(id => !removeSet.has(id))

  await updateGroup(groupId, {
    customerIds: updatedIds
  })
}

export async function getGroupCustomers(groupId: string): Promise<string[]> {
  const group = await getGroup(groupId)

  if (!group) {
    return []
  }

  if (group.type === 'static') {
    return group.customerIds || []
  }

  // For dynamic groups, evaluate criteria
  return await evaluateDynamicGroup(group.criteria!)
}

async function evaluateDynamicGroup(criteria: GroupCriteria): Promise<string[]> {
  const { getCustomersFromCache, getSubscriptionsFromCache, getInvoicesFromCache, getChargesFromCache } = await import('./firestore')

  const [customers, subscriptions, invoices, charges] = await Promise.all([
    getCustomersFromCache(),
    getSubscriptionsFromCache(),
    getInvoicesFromCache(),
    getChargesFromCache()
  ]) as [any[], any[], any[], any[]]

  // Group data by customer
  const subscriptionsByCustomer = new Map<string, any[]>()
  subscriptions.forEach(sub => {
    const customerId = sub.customerId
    if (customerId) {
      const existing = subscriptionsByCustomer.get(customerId) || []
      existing.push(sub)
      subscriptionsByCustomer.set(customerId, existing)
    }
  })

  const invoicesByCustomer = new Map<string, any[]>()
  invoices.forEach(inv => {
    const customerId = inv.customerId
    if (customerId) {
      const existing = invoicesByCustomer.get(customerId) || []
      existing.push(inv)
      invoicesByCustomer.set(customerId, existing)
    }
  })

  const chargesByCustomer = new Map<string, any[]>()
  charges.forEach(charge => {
    const customerId = charge.customerId
    if (customerId) {
      const existing = chargesByCustomer.get(customerId) || []
      existing.push(charge)
      chargesByCustomer.set(customerId, existing)
    }
  })

  // Filter customers based on criteria
  const matchingCustomers = customers.filter(customer => {
    const customerId = customer.stripeId || customer.id
    const customerSubs = subscriptionsByCustomer.get(customerId) || []
    const customerInvoices = invoicesByCustomer.get(customerId) || []
    const customerCharges = chargesByCustomer.get(customerId) || []

    // Calculate total spent
    const invoiceTotal = customerInvoices
      .filter(inv => inv.status === 'paid' && inv.amountPaid)
      .reduce((sum, invoice) => sum + invoice.amountPaid, 0)

    const chargeTotal = customerCharges
      .filter(charge => charge.status === 'succeeded')
      .reduce((sum, charge) => sum + charge.amount, 0)

    const totalSpent = (invoiceTotal + chargeTotal) / 100

    // Check spending criteria
    if (criteria.minTotalSpent !== undefined && totalSpent < criteria.minTotalSpent) {
      return false
    }
    if (criteria.maxTotalSpent !== undefined && totalSpent > criteria.maxTotalSpent) {
      return false
    }

    // Check status criteria
    const hasActiveSubscription = customerSubs.some(sub =>
      ['active', 'trialing', 'past_due'].includes(sub.status)
    )
    const status = hasActiveSubscription ? 'active' :
                   customerSubs.length > 0 ? 'inactive' : 'churned'

    if (criteria.status && !criteria.status.includes(status)) {
      return false
    }

    // Check subscription criteria
    if (criteria.hasActiveSubscription !== undefined) {
      if (criteria.hasActiveSubscription !== hasActiveSubscription) {
        return false
      }
    }

    if (criteria.hasAnySubscription !== undefined) {
      if (criteria.hasAnySubscription !== (customerSubs.length > 0)) {
        return false
      }
    }

    // Check date criteria
    const createdDate = new Date(customer.created * 1000)
    if (criteria.createdAfter && createdDate < new Date(criteria.createdAfter)) {
      return false
    }
    if (criteria.createdBefore && createdDate > new Date(criteria.createdBefore)) {
      return false
    }

    // Check order count
    const orderCount = customerInvoices.length + customerCharges.length
    if (criteria.minOrders !== undefined && orderCount < criteria.minOrders) {
      return false
    }
    if (criteria.maxOrders !== undefined && orderCount > criteria.maxOrders) {
      return false
    }

    return true
  })

  return matchingCustomers.map(c => c.stripeId || c.id)
}
