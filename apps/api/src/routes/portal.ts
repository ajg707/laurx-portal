import express from 'express';
import jwt from 'jsonwebtoken';
import { validateJWTPayload } from '../utils/auth';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (!validateJWTPayload(decoded)) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Get user profile/dashboard data
router.get('/dashboard', authenticateToken, async (req: any, res: any) => {
  try {
    const userEmail = req.user.email;
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

    // Find customer by email in Stripe
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    let isSubscriber = false;
    let activeSubscriptions = 0;
    let totalOrders = 0;
    let nextDelivery = null;
    let hasPayments = false;

    if (customers.data.length > 0) {
      const customer = customers.data[0];

      // Check for active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 100
      });

      activeSubscriptions = subscriptions.data.length;
      isSubscriber = activeSubscriptions > 0;

      // Get next delivery date from active subscription
      if (subscriptions.data.length > 0) {
        const nextPeriodEnd = Math.min(...subscriptions.data.map(sub => sub.current_period_end));
        nextDelivery = new Date(nextPeriodEnd * 1000).toISOString();
      }

      // Check for any payments (invoices AND charges)
      const [invoices, charges] = await Promise.all([
        stripe.invoices.list({
          customer: customer.id,
          limit: 100
        }),
        stripe.charges.list({
          customer: customer.id,
          limit: 100
        })
      ]);

      const paidInvoices = invoices.data.filter(inv => inv.status === 'paid').length;
      const successfulCharges = charges.data.filter(charge => charge.status === 'succeeded').length;
      totalOrders = paidInvoices + successfulCharges;
      hasPayments = totalOrders > 0;
    }

    const dashboardData = {
      user: {
        email: userEmail,
        name: userEmail.split('@')[0], // Simple name extraction
        isSubscriber, // Flag indicating if user has active recurring subscription
        hasPayments, // Flag indicating if user has made any payments
        joinDate: new Date().toISOString(),
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: true
        }
      },
      stats: {
        totalOrders,
        activeSubscriptions,
        totalSaved: 0,
        nextDelivery
      },
      recentActivity: [],
      quickActions: [
        {
          id: 'manage-subscription',
          title: 'Manage Subscriptions',
          description: 'View and modify your LAURx subscriptions',
          icon: 'subscription',
          url: '/subscriptions'
        },
        {
          id: 'payment-methods',
          title: 'Payment Methods',
          description: 'Update your payment information',
          icon: 'payment',
          url: '/payment-methods'
        },
        {
          id: 'order-history',
          title: 'Order History',
          description: 'View past orders and invoices',
          icon: 'history',
          url: '/orders'
        },
        {
          id: 'support',
          title: 'Get Support',
          description: 'Contact our customer support team',
          icon: 'support',
          url: '/support'
        }
      ]
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req: any, res: any) => {
  try {
    const { preferences } = req.body;
    const userEmail = req.user.email;
    
    // Validate preferences structure
    const validPreferences = {
      emailNotifications: Boolean(preferences?.emailNotifications),
      smsNotifications: Boolean(preferences?.smsNotifications),
      marketingEmails: Boolean(preferences?.marketingEmails)
    };

    // In a real app, you'd save this to a database
    console.log(`Updated preferences for ${userEmail}:`, validPreferences);

    res.json({
      message: 'Preferences updated successfully',
      preferences: validPreferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get support tickets (placeholder)
router.get('/support/tickets', authenticateToken, async (req: any, res: any) => {
  try {
    // Mock support tickets data
    const tickets = [
      {
        id: 'ticket-001',
        subject: 'Question about LAURx dosage',
        status: 'open',
        priority: 'medium',
        created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        messages: 2
      }
    ];

    res.json({ tickets });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// Create support ticket
router.post('/support/tickets', authenticateToken, async (req: any, res: any) => {
  try {
    const { subject, message, priority = 'medium' } = req.body;
    const userEmail = req.user.email;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    // In a real app, you'd save this to a database and possibly send an email
    const ticket = {
      id: `ticket-${Date.now()}`,
      subject,
      message,
      priority,
      status: 'open',
      userEmail,
      created: new Date().toISOString()
    };

    console.log('New support ticket created:', ticket);

    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        created: ticket.created
      }
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// Get product information
router.get('/products', async (req: any, res: any) => {
  try {
    // Mock product data based on what we saw on the website
    const products = [
      {
        id: 'laurx-immune-support',
        name: 'LAURx Immune Support',
        description: 'A daily formula for immune defense. Support it consistently, and your body is better equipped to fend off what\'s going around—and bounce back faster when it counts.',
        price: {
          oneTime: 6295, // $62.95 in cents
          subscription: 5351 // $53.51 in cents (15% off)
        },
        currency: 'usd',
        images: [
          '/images/laurx-bottle.jpg'
        ],
        features: [
          'Daily immune support',
          'Early symptom relief',
          'Faster recovery',
          'Natural ingredients',
          'NDC 82532-058-01'
        ],
        subscriptionOptions: [
          {
            interval: 'month',
            intervalCount: 1,
            discount: 15,
            description: 'Save 15% with monthly delivery'
          }
        ],
        inStock: true,
        freeShippingThreshold: 10000 // $100 in cents
      }
    ];

    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get order/payment history for customer
router.get('/order-history', authenticateToken, async (req: any, res: any) => {
  try {
    const userEmail = req.user.email;
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

    // Find customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (customers.data.length === 0) {
      // Still show available coupons even if customer doesn't exist yet
      const allCoupons = await stripe.coupons.list({ limit: 100 });
      const availableCoupons = allCoupons.data
        .filter(coupon => coupon.valid)
        .map(coupon => ({
          id: coupon.id,
          code: coupon.name || coupon.id,
          percentOff: coupon.percent_off,
          amountOff: coupon.amount_off ? coupon.amount_off / 100 : null,
          duration: coupon.duration,
          durationInMonths: coupon.duration_in_months,
          redeemBy: coupon.redeem_by ? new Date(coupon.redeem_by * 1000).toISOString() : null
        }));

      return res.json({
        orders: [],
        subscriptions: [],
        appliedCoupons: [],
        availableCoupons,
        totalSpent: 0
      });
    }

    const customer = customers.data[0];

    // Fetch all transaction data
    const [charges, invoices, subscriptions] = await Promise.all([
      stripe.charges.list({ customer: customer.id, limit: 100 }),
      stripe.invoices.list({ customer: customer.id, limit: 100 }),
      stripe.subscriptions.list({ customer: customer.id, limit: 100 })
    ]);

    // Combine charges and invoices into order history
    const orders = [
      ...charges.data.map(charge => ({
        id: charge.id,
        date: new Date(charge.created * 1000).toISOString(),
        amount: charge.amount / 100,
        currency: charge.currency,
        status: charge.status,
        description: charge.description || 'Payment',
        receiptUrl: charge.receipt_url,
        type: 'charge' as const
      })),
      ...invoices.data.map(invoice => ({
        id: invoice.id,
        date: new Date(invoice.created * 1000).toISOString(),
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency || 'usd',
        status: invoice.status || 'unknown',
        description: invoice.description || `Invoice ${invoice.number || ''}`,
        receiptUrl: invoice.hosted_invoice_url,
        invoiceNumber: invoice.number,
        type: 'invoice' as const
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Get applied coupons from subscriptions
    const appliedCoupons = subscriptions.data
      .filter(sub => sub.discount?.coupon)
      .map(sub => ({
        subscriptionId: sub.id,
        couponId: sub.discount!.coupon!.id,
        couponCode: sub.discount!.coupon!.name || sub.discount!.coupon!.id,
        percentOff: sub.discount!.coupon!.percent_off,
        amountOff: sub.discount!.coupon!.amount_off ? sub.discount!.coupon!.amount_off / 100 : null,
        duration: sub.discount!.coupon!.duration,
        validUntil: sub.discount!.end ? new Date(sub.discount!.end * 1000).toISOString() : null
      }));

    // Get all available coupons for customer
    const allCoupons = await stripe.coupons.list({ limit: 100 });
    const availableCoupons = allCoupons.data
      .filter(coupon => coupon.valid)
      .map(coupon => ({
        id: coupon.id,
        code: coupon.name || coupon.id,
        percentOff: coupon.percent_off,
        amountOff: coupon.amount_off ? coupon.amount_off / 100 : null,
        duration: coupon.duration,
        durationInMonths: coupon.duration_in_months,
        redeemBy: coupon.redeem_by ? new Date(coupon.redeem_by * 1000).toISOString() : null
      }));

    // Calculate total spent
    const totalSpent = orders.reduce((sum, order) => {
      if (order.status === 'succeeded' || order.status === 'paid') {
        return sum + order.amount;
      }
      return sum;
    }, 0);

    res.json({
      orders,
      subscriptions: subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        plan: sub.items.data[0]?.price?.nickname || 'Subscription',
        amount: (sub.items.data[0]?.price?.unit_amount || 0) / 100,
        interval: sub.items.data[0]?.price?.recurring?.interval
      })),
      appliedCoupons,
      availableCoupons,
      totalSpent
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

// Submit support request (refund, cancellation, or general support)
router.post('/support/request', authenticateToken, async (req: any, res: any) => {
  try {
    const { type, subject, message, subscriptionId, orderId } = req.body;
    const userEmail = req.user.email;

    if (!type || !subject || !message) {
      return res.status(400).json({ error: 'Type, subject, and message are required' });
    }

    // Valid types: 'refund', 'cancellation', 'general'
    const validTypes = ['refund', 'cancellation', 'general'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid request type' });
    }

    // Send email notification to support team
    const { sendEmail } = await import('../services/emailService');
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@mylaurelrose.com';

    let emailSubject = '';
    let emailBody = '';

    switch (type) {
      case 'refund':
        emailSubject = `Refund Request from ${userEmail}`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #7c3aed;">Refund Request</h2>
            <p><strong>Customer:</strong> ${userEmail}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            ${orderId ? `<p><strong>Order ID:</strong> ${orderId}</p>` : ''}
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Message:</strong></p>
              <p style="margin: 10px 0 0 0;">${message}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This is an automated notification from the customer portal.</p>
          </div>
        `;
        break;

      case 'cancellation':
        emailSubject = `Cancellation Request from ${userEmail}`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #7c3aed;">Subscription Cancellation Request</h2>
            <p><strong>Customer:</strong> ${userEmail}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            ${subscriptionId ? `<p><strong>Subscription ID:</strong> ${subscriptionId}</p>` : ''}
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Reason:</strong></p>
              <p style="margin: 10px 0 0 0;">${message}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This is an automated notification from the customer portal.</p>
          </div>
        `;
        break;

      case 'general':
        emailSubject = `Support Request from ${userEmail}`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #7c3aed;">Support Request</h2>
            <p><strong>Customer:</strong> ${userEmail}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Message:</strong></p>
              <p style="margin: 10px 0 0 0;">${message}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This is an automated notification from the customer portal.</p>
          </div>
        `;
        break;
    }

    // Send email to support team
    await sendEmail({
      to: supportEmail,
      subject: emailSubject,
      html: emailBody
    });

    // Send confirmation email to customer
    await sendEmail({
      to: userEmail,
      subject: `We received your ${type} request`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed;">Request Received</h2>
          <p>Hi there,</p>
          <p>We've received your ${type} request and our support team will review it shortly.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Your request:</strong></p>
            <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 0;">${message}</p>
          </div>
          <p>You should hear back from us within 24-48 hours.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The Laurel Rose Team</strong></p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Support request submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting support request:', error);
    res.status(500).json({ error: 'Failed to submit support request' });
  }
});

// Health check for portal
router.get('/health', (req: any, res: any) => {
  res.json({
    status: 'OK',
    service: 'LAURx Portal API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export { router as portalRoutes };
