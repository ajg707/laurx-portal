import Stripe from 'stripe'
import * as dotenv from 'dotenv'

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' })

async function createDemoCustomer() {
  try {
    const email = 'mglynn@mylaurelrose.com'
    const name = 'Michelle Glynn'

    console.log('Creating demo customer...')

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({ email, limit: 1 })
    let customer: Stripe.Customer

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
      console.log(`Customer already exists: ${customer.id}`)
    } else {
      // Create customer
      customer = await stripe.customers.create({
        email,
        name,
        description: 'Demo customer account for portal preview'
      })
      console.log(`Created customer: ${customer.id}`)
    }

    // Create a demo product and price if they don't exist
    let product: Stripe.Product
    const products = await stripe.products.list({ limit: 1 })

    if (products.data.length === 0) {
      product = await stripe.products.create({
        name: 'LAURx Monthly Subscription',
        description: 'Monthly subscription service'
      })
      console.log(`Created product: ${product.id}`)

      // Create price
      await stripe.prices.create({
        product: product.id,
        unit_amount: 2999, // $29.99
        currency: 'usd',
        recurring: {
          interval: 'month'
        }
      })
      console.log('Created price')
    } else {
      product = products.data[0]
      console.log(`Using existing product: ${product.id}`)
    }

    // Get a recurring price
    const prices = await stripe.prices.list({ product: product.id, limit: 100 })
    let price = prices.data.find(p => p.recurring !== null)

    if (!price) {
      // Create a recurring price if none exists
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: 2999, // $29.99
        currency: 'usd',
        recurring: {
          interval: 'month'
        }
      })
      console.log('Created recurring price')
    }

    // Check if customer already has a subscription
    const existingSubs = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 1
    })

    if (existingSubs.data.length === 0) {
      // Create a subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        trial_period_days: 14 // Give a trial so no immediate payment
      })
      console.log(`Created subscription: ${subscription.id}`)
    } else {
      console.log(`Customer already has subscription: ${existingSubs.data[0].id}`)
    }

    // Check payment history
    const charges = await stripe.charges.list({ customer: customer.id, limit: 5 })
    console.log(`Customer has ${charges.data.length} payment(s) on record`)

    console.log('\n✅ Demo customer setup complete!')
    console.log(`\nCustomer Details:`)
    console.log(`  Email: ${email}`)
    console.log(`  Name: ${name}`)
    console.log(`  Stripe ID: ${customer.id}`)
    console.log(`\nThey can now log into the customer portal at:`)
    console.log(`  https://lr-subscriber-portal-68069.web.app`)
    console.log(`\nA verification code will be sent to their email when they log in.`)

  } catch (error) {
    console.error('Error creating demo customer:', error)
    process.exit(1)
  }
}

createDemoCustomer()
