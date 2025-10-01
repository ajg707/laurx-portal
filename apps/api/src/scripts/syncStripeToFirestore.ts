// Script to sync existing Stripe data to Firestore
import dotenv from 'dotenv'
import path from 'path'
import Stripe from 'stripe'
import {
  saveCustomer,
  saveSubscription,
  saveInvoice,
  saveCharge
} from '../services/firestore'

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env')
dotenv.config({ path: envPath })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
})

async function syncStripeToFirestore() {
  console.log('🔄 Starting Stripe to Firestore sync...')

  try {
    // Sync customers
    console.log('📦 Syncing customers...')
    const customers = await stripe.customers.list({ limit: 100 })
    for (const customer of customers.data) {
      await saveCustomer(customer)
      console.log(`  ✓ Saved customer: ${customer.email || customer.id}`)
    }
    console.log(`✅ Synced ${customers.data.length} customers`)

    // Sync subscriptions
    console.log('📦 Syncing subscriptions...')
    const subscriptions = await stripe.subscriptions.list({ limit: 100 })
    for (const subscription of subscriptions.data) {
      await saveSubscription(subscription)
      console.log(`  ✓ Saved subscription: ${subscription.id}`)
    }
    console.log(`✅ Synced ${subscriptions.data.length} subscriptions`)

    // Sync invoices
    console.log('📦 Syncing invoices...')
    const invoices = await stripe.invoices.list({ limit: 100 })
    for (const invoice of invoices.data) {
      await saveInvoice(invoice)
      console.log(`  ✓ Saved invoice: ${invoice.id}`)
    }
    console.log(`✅ Synced ${invoices.data.length} invoices`)

    // Sync charges
    console.log('📦 Syncing charges...')
    const charges = await stripe.charges.list({ limit: 100 })
    for (const charge of charges.data) {
      await saveCharge(charge)
      console.log(`  ✓ Saved charge: ${charge.id}`)
    }
    console.log(`✅ Synced ${charges.data.length} charges`)

    console.log('🎉 Sync complete!')
  } catch (error) {
    console.error('❌ Error syncing data:', error)
    process.exit(1)
  }
}

// Run the sync
syncStripeToFirestore()
