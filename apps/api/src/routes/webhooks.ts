import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import {
  saveCustomer,
  saveSubscription,
  saveInvoice,
  saveCharge,
  deleteCustomer,
  deleteSubscription,
  logWebhookEvent
} from '../services/firestore'

const router = Router()

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

// Stripe webhook endpoint
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']

  if (!sig || !WEBHOOK_SECRET || !stripe) {
    return res.status(400).json({ error: 'Webhook signature or secret missing' })
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  // Log the event
  await logWebhookEvent(event)

  try {
    // Handle the event
    switch (event.type) {
      // Customer events
      case 'customer.created':
      case 'customer.updated':
        await saveCustomer(event.data.object)
        console.log('Customer saved to Firestore:', event.data.object.id)
        break

      case 'customer.deleted':
        await deleteCustomer((event.data.object as any).id)
        console.log('Customer deleted from Firestore:', (event.data.object as any).id)
        break

      // Subscription events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await saveSubscription(event.data.object)
        console.log('Subscription saved to Firestore:', event.data.object.id)
        break

      case 'customer.subscription.deleted':
        await deleteSubscription(event.data.object.id)
        console.log('Subscription deleted from Firestore:', event.data.object.id)
        break

      // Invoice events
      case 'invoice.created':
      case 'invoice.updated':
      case 'invoice.finalized':
      case 'invoice.paid':
      case 'invoice.payment_failed':
        await saveInvoice(event.data.object)
        console.log('Invoice saved to Firestore:', event.data.object.id)
        break

      // Charge events
      case 'charge.succeeded':
      case 'charge.updated':
      case 'charge.refunded':
        await saveCharge(event.data.object)
        console.log('Charge saved to Firestore:', event.data.object.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Error processing webhook' })
  }
})

export default router
