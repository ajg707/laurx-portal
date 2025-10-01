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

      // Check for any payments (invoices)
      const invoices = await stripe.invoices.list({
        customer: customer.id,
        limit: 100
      });

      totalOrders = invoices.data.filter(inv => inv.status === 'paid').length;
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
