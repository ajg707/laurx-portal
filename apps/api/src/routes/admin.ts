import express from 'express'
import jwt from 'jsonwebtoken'
import { sendEmail } from '../services/emailService'
import Stripe from 'stripe'
import { 
  validateEmailConfig, 
  testSMTPConnection, 
  sendTestEmail, 
  getEmailConfigStatus 
} from '../utils/emailValidator'

const router = express.Router()

// Initialize Stripe with error handling
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY is not set in environment variables!')
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', { apiVersion: '2023-10-16' })

// Admin users - in production, this should be in a database
const ADMIN_USERS = [
  {
    id: 'admin-1',
    email: 'mglynn@mylaurelrose.com',
    name: 'Admin User',
    role: 'super_admin',
    permissions: ['all']
  },
  {
    id: 'admin-2',
    email: 'ajgregware4290@gmail.com',
    name: 'Admin User',
    role: 'super_admin',
    permissions: ['all']
  }
]

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: number }>()

// Generate random 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString()

// Admin authentication middleware
const authenticateAdmin = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const adminUser = ADMIN_USERS.find(user => user.id === decoded.userId)
    
    if (!adminUser) {
      return res.status(401).json({ message: 'Invalid admin user' })
    }

    req.adminUser = adminUser
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// Request verification code
router.post('/auth/request-code', async (req, res) => {
  try {
    const { email } = req.body

    // Check if email is authorized admin
    const adminUser = ADMIN_USERS.find(user => user.email === email)
    if (!adminUser) {
      return res.status(403).json({ message: 'Unauthorized email address' })
    }

    const code = generateCode()
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutes

    verificationCodes.set(email, { code, expires })

    await sendEmail({
      to: email,
      subject: 'LAURx Admin Portal - Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">LAURx Admin Portal</h2>
          <p>Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    })

    res.json({ message: 'Verification code sent' })
  } catch (error) {
    console.error('Error sending admin verification code:', error)
    res.status(500).json({ message: 'Failed to send verification code' })
  }
})

// Verify code and login
router.post('/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body

    const storedData = verificationCodes.get(email)
    if (!storedData) {
      return res.status(400).json({ message: 'No verification code found' })
    }

    if (Date.now() > storedData.expires) {
      verificationCodes.delete(email)
      return res.status(400).json({ message: 'Verification code expired' })
    }

    if (storedData.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' })
    }

    // Clean up used code
    verificationCodes.delete(email)

    const adminUser = ADMIN_USERS.find(user => user.email === email)
    if (!adminUser) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const token = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        permissions: adminUser.permissions
      }
    })
  } catch (error) {
    console.error('Error verifying admin code:', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

// Debug endpoint to check configuration
router.get('/debug/config', authenticateAdmin, async (req, res) => {
  try {
    res.json({
      stripeKeySet: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'NOT_SET',
      jwtSecretSet: !!process.env.JWT_SECRET,
      emailConfigured: !!process.env.SMTP_USER,
      nodeEnv: process.env.NODE_ENV
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get config' })
  }
})

// Get customers with subscription data
router.get('/customers', authenticateAdmin, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: 'Stripe API key not configured' })
    }

    // Fetch all data in parallel (much faster than per-customer)
    const [customersResponse, subscriptionsResponse, invoicesResponse, chargesResponse] = await Promise.all([
      stripe.customers.list({ limit: 100 }),
      stripe.subscriptions.list({ limit: 100 }),
      stripe.invoices.list({ limit: 100 }),
      stripe.charges.list({ limit: 100 })
    ])

    // Group subscriptions and invoices by customer
    const subscriptionsByCustomer = new Map<string, typeof subscriptionsResponse.data>()
    subscriptionsResponse.data.forEach(sub => {
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
      if (customerId) {
        const existing = subscriptionsByCustomer.get(customerId) || []
        existing.push(sub)
        subscriptionsByCustomer.set(customerId, existing)
      }
    })

    const invoicesByCustomer = new Map<string, typeof invoicesResponse.data>()
    invoicesResponse.data.forEach(inv => {
      const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id
      if (customerId) {
        const existing = invoicesByCustomer.get(customerId) || []
        existing.push(inv)
        invoicesByCustomer.set(customerId, existing)
      }
    })

    const chargesByCustomer = new Map<string, typeof chargesResponse.data>()
    chargesResponse.data.forEach(charge => {
      const customerId = charge.customer as string
      if (customerId) {
        const existing = chargesByCustomer.get(customerId) || []
        existing.push(charge)
        chargesByCustomer.set(customerId, existing)
      }
    })

    // Build customer objects
    const customersWithSubscriptions = customersResponse.data.map(customer => {
      const customerSubs = subscriptionsByCustomer.get(customer.id) || []
      const customerInvoices = invoicesByCustomer.get(customer.id) || []
      const customerCharges = chargesByCustomer.get(customer.id) || []

      // Calculate total spent from both invoices and charges
      const invoiceTotal = customerInvoices
        .filter(inv => inv.status === 'paid' && inv.amount_paid)
        .reduce((sum, invoice) => sum + invoice.amount_paid, 0)

      const chargeTotal = customerCharges
        .filter(charge => charge.status === 'succeeded' && charge.paid)
        .reduce((sum, charge) => sum + charge.amount, 0)

      const totalSpent = (invoiceTotal + chargeTotal) / 100

      const hasActiveSubscription = customerSubs.some(sub =>
        ['active', 'trialing', 'past_due'].includes(sub.status)
      )

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name || customer.email,
        subscriptions: customerSubs.map(sub => ({
          id: sub.id,
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
          product: sub.items.data[0]?.price?.nickname || 'Unknown',
          price: (sub.items.data[0]?.price?.unit_amount || 0) / 100,
          interval: sub.items.data[0]?.price?.recurring?.interval || 'month'
        })),
        totalSpent,
        createdAt: new Date(customer.created * 1000).toISOString(),
        lastOrderDate: customerInvoices[0] ? new Date(customerInvoices[0].created * 1000).toISOString() : undefined,
        status: hasActiveSubscription ? 'active' :
                customerSubs.length > 0 ? 'inactive' : 'churned'
      }
    })

    res.json({ customers: customersWithSubscriptions })
  } catch (error) {
    console.error('Error fetching customers:', error)
    res.status(500).json({ message: 'Failed to fetch customers' })
  }
})

// Get analytics data
router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: 'Stripe API key not configured' })
    }

    const customers = await stripe.customers.list({ limit: 100 })
    const subscriptions = await stripe.subscriptions.list({ limit: 100 })
    const invoices = await stripe.invoices.list({ limit: 100 })

    // Count active subscriptions (including trialing, active, past_due)
    const activeSubscriptions = subscriptions.data.filter(sub =>
      ['active', 'trialing', 'past_due'].includes(sub.status)
    ).length

    const totalCustomers = customers.data.length

    // Calculate current month revenue
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    const monthlyInvoices = invoices.data.filter(invoice =>
      invoice.status === 'paid' && new Date(invoice.created * 1000) >= currentMonth
    )
    const monthlyRevenue = monthlyInvoices.reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0) / 100

    // Calculate all-time revenue
    const allTimeRevenue = invoices.data
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0) / 100

    // Calculate last 30 days revenue
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const last30DaysInvoices = invoices.data.filter(invoice =>
      invoice.status === 'paid' && new Date(invoice.created * 1000) >= thirtyDaysAgo
    )
    const last30DaysRevenue = last30DaysInvoices.reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0) / 100

    // Calculate churn rate (simplified)
    const cancelledSubs = subscriptions.data.filter(sub => sub.status === 'canceled').length
    const churnRate = totalCustomers > 0 ? (cancelledSubs / totalCustomers) * 100 : 0

    // Get recent invoices for activity
    const recentInvoices = invoices.data
      .filter(inv => inv.status === 'paid')
      .sort((a, b) => b.created - a.created)
      .slice(0, 5)

    const recentActivity = recentInvoices.map(invoice => ({
      id: invoice.id,
      type: 'payment_received' as const,
      description: `Payment of $${(invoice.amount_paid || 0) / 100} from ${invoice.customer_email || 'customer'}`,
      timestamp: new Date(invoice.created * 1000).toISOString()
    }))

    const analytics = {
      totalCustomers,
      activeSubscriptions,
      monthlyRevenue,
      allTimeRevenue,
      last30DaysRevenue,
      churnRate,
      emailStats: {
        campaignsSent: 0,
        averageOpenRate: 0,
        averageClickRate: 0
      },
      recentActivity,
      debug: {
        totalInvoices: invoices.data.length,
        paidInvoices: invoices.data.filter(i => i.status === 'paid').length,
        totalSubscriptions: subscriptions.data.length,
        subscriptionStatuses: subscriptions.data.reduce((acc, sub) => {
          acc[sub.status] = (acc[sub.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }

    res.json({ analytics })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ message: 'Failed to fetch analytics' })
  }
})

// Send email campaign
router.post('/email-campaigns', authenticateAdmin, async (req, res) => {
  try {
    const { name, subject, content, type, recipients } = req.body

    // Get customer emails based on criteria
    let customerEmails: string[] = []
    
    if (recipients === 'all') {
      const customers = await stripe.customers.list({ limit: 100 })
      customerEmails = customers.data.map(c => c.email).filter(Boolean) as string[]
    } else if (recipients === 'active_subscribers') {
      const subscriptions = await stripe.subscriptions.list({ 
        status: 'active',
        limit: 100 
      })
      const customerIds = subscriptions.data.map(sub => sub.customer as string)
      const customers = await Promise.all(
        customerIds.map(id => stripe.customers.retrieve(id))
      )
      customerEmails = customers
        .map(c => typeof c !== 'string' && !c.deleted && 'email' in c ? c.email : null)
        .filter(Boolean) as string[]
    }

    // Send emails
    const emailPromises = customerEmails.map(email => 
      sendEmail({
        to: email,
        subject,
        html: content
      })
    )

    await Promise.all(emailPromises)

    const campaign = {
      id: `campaign_${Date.now()}`,
      name,
      subject,
      content,
      type,
      status: 'sent',
      sentAt: new Date().toISOString(),
      recipients: customerEmails.length,
      openRate: 0, // Would be tracked with email service
      clickRate: 0
    }

    res.json({ campaign })
  } catch (error) {
    console.error('Error sending email campaign:', error)
    res.status(500).json({ message: 'Failed to send email campaign' })
  }
})

// Create automation rule
router.post('/automation-rules', authenticateAdmin, async (req, res) => {
  try {
    const { name, trigger, triggerDays, emailTemplate } = req.body

    // In production, save to database
    const rule = {
      id: `rule_${Date.now()}`,
      name,
      trigger,
      triggerDays,
      emailTemplate,
      isActive: true,
      createdAt: new Date().toISOString()
    }

    res.json({ rule })
  } catch (error) {
    console.error('Error creating automation rule:', error)
    res.status(500).json({ message: 'Failed to create automation rule' })
  }
})

// Create coupon
router.post('/coupons', authenticateAdmin, async (req, res) => {
  try {
    const { code, type, value, description, expiresAt, maxUses } = req.body

    const couponData: any = {
      id: code.toLowerCase().replace(/\s+/g, '_'),
      name: description,
      metadata: { description }
    }

    if (type === 'percent') {
      couponData.percent_off = value
    } else {
      couponData.amount_off = value * 100 // Convert to cents
      couponData.currency = 'usd'
    }

    if (expiresAt) {
      couponData.redeem_by = Math.floor(new Date(expiresAt).getTime() / 1000)
    }

    if (maxUses) {
      couponData.max_redemptions = maxUses
    }

    const stripeCoupon = await stripe.coupons.create(couponData)

    const coupon = {
      id: stripeCoupon.id,
      code: stripeCoupon.id,
      type,
      value,
      description,
      expiresAt,
      maxUses,
      usedCount: stripeCoupon.times_redeemed || 0,
      isActive: stripeCoupon.valid,
      createdAt: new Date(stripeCoupon.created * 1000).toISOString()
    }

    res.json({ coupon })
  } catch (error) {
    console.error('Error creating coupon:', error)
    res.status(500).json({ message: 'Failed to create coupon' })
  }
})

// Apply coupon to customer
router.post('/customers/:customerId/apply-coupon', authenticateAdmin, async (req, res) => {
  try {
    const { customerId } = req.params
    const { couponId } = req.body

    // Get customer's active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    })

    if (subscriptions.data.length === 0) {
      return res.status(400).json({ message: 'No active subscription found' })
    }

    const subscription = subscriptions.data[0]

    // Apply coupon to subscription
    await stripe.subscriptions.update(subscription.id, {
      coupon: couponId
    })

    res.json({ message: 'Coupon applied successfully' })
  } catch (error) {
    console.error('Error applying coupon:', error)
    res.status(500).json({ message: 'Failed to apply coupon' })
  }
})

// Get email campaigns (mock data for now)
router.get('/email-campaigns', authenticateAdmin, async (req, res) => {
  try {
    const campaigns = [
      {
        id: 'campaign_1',
        name: 'Welcome Series',
        subject: 'Welcome to LAURx!',
        content: '<h1>Welcome!</h1><p>Thank you for subscribing.</p>',
        type: 'thank_you',
        status: 'sent',
        sentAt: new Date().toISOString(),
        recipients: 25,
        openRate: 28.5,
        clickRate: 4.2
      }
    ]

    res.json({ campaigns })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    res.status(500).json({ message: 'Failed to fetch campaigns' })
  }
})

// Get automation rules (mock data for now)
router.get('/automation-rules', authenticateAdmin, async (req, res) => {
  try {
    const rules = [
      {
        id: 'rule_1',
        name: 'Subscription Ending Reminder',
        trigger: 'subscription_ending',
        triggerDays: 3,
        emailTemplate: 'Your subscription is ending soon. Renew now!',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ]

    res.json({ rules })
  } catch (error) {
    console.error('Error fetching automation rules:', error)
    res.status(500).json({ message: 'Failed to fetch automation rules' })
  }
})

// Get coupons
router.get('/coupons', authenticateAdmin, async (req, res) => {
  try {
    const stripeCoupons = await stripe.coupons.list({ limit: 50 })
    
    const coupons = stripeCoupons.data.map(coupon => ({
      id: coupon.id,
      code: coupon.id,
      type: coupon.percent_off ? 'percent' : 'amount',
      value: coupon.percent_off || (coupon.amount_off ? coupon.amount_off / 100 : 0),
      description: coupon.metadata?.description || coupon.name || 'No description',
      expiresAt: coupon.redeem_by ? new Date(coupon.redeem_by * 1000).toISOString() : undefined,
      maxUses: coupon.max_redemptions,
      usedCount: coupon.times_redeemed || 0,
      isActive: coupon.valid,
      createdAt: new Date(coupon.created * 1000).toISOString()
    }))

    res.json({ coupons })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    res.status(500).json({ message: 'Failed to fetch coupons' })
  }
})

// EMAIL CONFIGURATION ENDPOINTS

// Get email configuration status
router.get('/email-config', authenticateAdmin, async (req, res) => {
  try {
    const status = getEmailConfigStatus()
    res.json({ status })
  } catch (error) {
    console.error('Error getting email config status:', error)
    res.status(500).json({ message: 'Failed to get email configuration status' })
  }
})

// Test SMTP connection
router.post('/email-config/test-smtp', authenticateAdmin, async (req, res) => {
  try {
    const result = await testSMTPConnection()
    res.json({ result })
  } catch (error) {
    console.error('Error testing SMTP connection:', error)
    res.status(500).json({ message: 'Failed to test SMTP connection' })
  }
})

// Send test email
router.post('/email-config/send-test', authenticateAdmin, async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' })
    }

    const result = await sendTestEmail(email)
    res.json({ result })
  } catch (error) {
    console.error('Error sending test email:', error)
    res.status(500).json({ message: 'Failed to send test email' })
  }
})

// Validate email configuration
router.post('/email-config/validate', authenticateAdmin, async (req, res) => {
  try {
    const validation = validateEmailConfig()
    res.json({ validation })
  } catch (error) {
    console.error('Error validating email config:', error)
    res.status(500).json({ message: 'Failed to validate email configuration' })
  }
})

export default router
