import admin from 'firebase-admin'

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Check if we have JSON credentials in environment (for Render/production)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || 'lr-subscriber-portal-68069'
      })
      console.log('✅ Firebase Admin initialized with service account credentials')
    } catch (error) {
      console.error('❌ Failed to parse Firebase credentials:', error)
      throw error
    }
  } else {
    // For local development, use application default credentials
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || 'lr-subscriber-portal-68069'
    })
    console.log('✅ Firebase Admin initialized with application default credentials')
  }
}

export const db = admin.firestore()

// Collection names
export const Collections = {
  CUSTOMERS: 'customers',
  SUBSCRIPTIONS: 'subscriptions',
  INVOICES: 'invoices',
  CHARGES: 'charges',
  COUPONS: 'coupons',
  WEBHOOK_EVENTS: 'webhook_events',
  CUSTOMER_GROUPS: 'customer_groups',
  EMAIL_CAMPAIGNS: 'email_campaigns',
  AUTOMATION_RULES: 'automation_rules'
}

// Customer data structure in Firestore
export interface FirestoreCustomer {
  stripeId: string
  email: string | null
  name: string | null
  created: number
  metadata: Record<string, any>
  lastUpdated: number
}

// Subscription data structure
export interface FirestoreSubscription {
  stripeId: string
  customerId: string
  status: string
  currentPeriodEnd: number
  currentPeriodStart: number
  cancelAtPeriodEnd: boolean
  planId: string
  planAmount: number
  planInterval: string
  planNickname: string | null
  lastUpdated: number
}

// Invoice data structure
export interface FirestoreInvoice {
  stripeId: string
  customerId: string
  status: string
  amountPaid: number
  amountDue: number
  created: number
  description: string | null
  hostedInvoiceUrl: string | null
  lastUpdated: number
}

// Charge data structure
export interface FirestoreCharge {
  stripeId: string
  customerId: string
  status: string
  amount: number
  created: number
  description: string | null
  receiptUrl: string | null
  lastUpdated: number
}

// Helper functions
export async function saveCustomer(customer: any) {
  const doc: FirestoreCustomer = {
    stripeId: customer.id,
    email: customer.email,
    name: customer.name,
    created: customer.created,
    metadata: customer.metadata || {},
    lastUpdated: Date.now()
  }

  await db.collection(Collections.CUSTOMERS).doc(customer.id).set(doc, { merge: true })
}

export async function saveSubscription(subscription: any) {
  const doc: FirestoreSubscription = {
    stripeId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
    currentPeriodStart: subscription.current_period_start,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    planId: subscription.items.data[0]?.price.id || '',
    planAmount: subscription.items.data[0]?.price.unit_amount || 0,
    planInterval: subscription.items.data[0]?.price.recurring?.interval || 'month',
    planNickname: subscription.items.data[0]?.price.nickname || null,
    lastUpdated: Date.now()
  }

  await db.collection(Collections.SUBSCRIPTIONS).doc(subscription.id).set(doc, { merge: true })
}

export async function saveInvoice(invoice: any) {
  const doc: FirestoreInvoice = {
    stripeId: invoice.id,
    customerId: invoice.customer,
    status: invoice.status,
    amountPaid: invoice.amount_paid || 0,
    amountDue: invoice.amount_due || 0,
    created: invoice.created,
    description: invoice.description || null,
    hostedInvoiceUrl: invoice.hosted_invoice_url || null,
    lastUpdated: Date.now()
  }

  await db.collection(Collections.INVOICES).doc(invoice.id).set(doc, { merge: true })
}

export async function saveCharge(charge: any) {
  const doc: FirestoreCharge = {
    stripeId: charge.id,
    customerId: charge.customer,
    status: charge.status,
    amount: charge.amount,
    created: charge.created,
    description: charge.description || null,
    receiptUrl: charge.receipt_url || null,
    lastUpdated: Date.now()
  }

  await db.collection(Collections.CHARGES).doc(charge.id).set(doc, { merge: true })
}

export async function deleteCustomer(customerId: string) {
  await db.collection(Collections.CUSTOMERS).doc(customerId).delete()
}

export async function deleteSubscription(subscriptionId: string) {
  await db.collection(Collections.SUBSCRIPTIONS).doc(subscriptionId).delete()
}

export async function getCustomersFromCache() {
  const snapshot = await db.collection(Collections.CUSTOMERS).get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function getSubscriptionsFromCache(customerId?: string) {
  let query: any = db.collection(Collections.SUBSCRIPTIONS)

  if (customerId) {
    query = query.where('customerId', '==', customerId)
  }

  const snapshot = await query.get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function getInvoicesFromCache(customerId?: string) {
  let query: any = db.collection(Collections.INVOICES)

  if (customerId) {
    query = query.where('customerId', '==', customerId)
  }

  const snapshot = await query.get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function getChargesFromCache(customerId?: string) {
  let query: any = db.collection(Collections.CHARGES)

  if (customerId) {
    query = query.where('customerId', '==', customerId)
  }

  const snapshot = await query.get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function logWebhookEvent(event: any) {
  await db.collection(Collections.WEBHOOK_EVENTS).add({
    eventId: event.id,
    type: event.type,
    created: event.created,
    data: event.data,
    receivedAt: Date.now()
  })
}
