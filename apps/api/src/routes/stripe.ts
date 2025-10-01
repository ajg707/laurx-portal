import express from 'express';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { validateJWTPayload } from '../utils/auth';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Webhook endpoint secret for local testing
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_3d7ebca240e14bf647c676abad69180b274f89970e5ad85facb48a4735172a1a';

// Middleware to verify JWT token
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Get customer subscriptions
router.get('/subscriptions', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // Find customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.json({ subscriptions: [] });
    }

    const customer = customers.data[0];
    
    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      expand: ['data.default_payment_method', 'data.items.data.price.product']
    });

    const formattedSubscriptions = subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: sub.canceled_at,
      items: sub.items.data.map(item => ({
        id: item.id,
        price: {
          id: item.price.id,
          unit_amount: item.price.unit_amount,
          currency: item.price.currency,
          recurring: item.price.recurring,
          product: item.price.product
        },
        quantity: item.quantity
      })),
      default_payment_method: sub.default_payment_method
    }));

    res.json({ subscriptions: formattedSubscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Request subscription cancellation/change - sends email to support
router.post('/subscriptions/:subscriptionId/request-change', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { requestType, reason, message } = req.body;

    // Verify the subscription belongs to the authenticated user
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customer = await stripe.customers.retrieve(subscription.customer as string);

    if (typeof customer === 'string' || !('email' in customer) || customer.email !== req.user!.email) {
      return res.status(403).json({ error: 'Unauthorized to modify this subscription' });
    }

    // Send email to support
    const { sendEmail } = await import('../services/emailService');

    const emailSubject = requestType === 'cancel'
      ? `Subscription Cancellation Request - ${customer.email}`
      : `Subscription Change Request - ${customer.email}`;

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Subscription ${requestType === 'cancel' ? 'Cancellation' : 'Change'} Request</h2>

        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">Customer Information</h3>
          <p><strong>Email:</strong> ${customer.email}</p>
          <p><strong>Name:</strong> ${customer.name || 'N/A'}</p>
          <p><strong>Customer ID:</strong> ${customer.id}</p>
        </div>

        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">Subscription Details</h3>
          <p><strong>Subscription ID:</strong> ${subscription.id}</p>
          <p><strong>Status:</strong> ${subscription.status}</p>
          <p><strong>Current Period End:</strong> ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}</p>
        </div>

        <div style="background: #fef3c7; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">Request Type</h3>
          <p><strong>${requestType === 'cancel' ? 'Cancel Subscription' : 'Change Subscription'}</strong></p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          ${message ? `<p><strong>Customer Message:</strong></p><p>${message}</p>` : ''}
        </div>

        <p style="color: #666; font-size: 12px;">Please contact the customer at ${customer.email} to process this request.</p>
      </div>
    `;

    await sendEmail({
      to: 'support@mylaurelrose.com',
      subject: emailSubject,
      html: emailBody
    });

    // Also send confirmation to customer
    await sendEmail({
      to: customer.email!,
      subject: `We received your subscription ${requestType} request`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">LAURx Support</h2>
          <p>Thank you for contacting us. We received your request to ${requestType === 'cancel' ? 'cancel' : 'change'} your subscription.</p>
          <p>Our support team will review your request and contact you shortly at ${customer.email}.</p>
          ${message ? `<p><strong>Your message:</strong></p><p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">${message}</p>` : ''}
          <p>If you have any questions, please reply to this email or contact us at support@mylaurelrose.com.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">Best regards,<br/>The LAURx Team</p>
        </div>
      `
    });

    res.json({
      message: 'Your request has been sent to our support team. We will contact you shortly.',
      request: {
        type: requestType,
        subscription_id: subscription.id,
        status: 'pending_review'
      }
    });
  } catch (error) {
    console.error('Error processing subscription change request:', error);
    res.status(500).json({ error: 'Failed to process your request. Please try again.' });
  }
});

// Cancel subscription (admin/direct action)
router.post('/subscriptions/:subscriptionId/cancel', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { cancel_at_period_end = true } = req.body;

    // Verify the subscription belongs to the authenticated user
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customer = await stripe.customers.retrieve(subscription.customer as string);

    if (typeof customer === 'string' || !('email' in customer) || customer.email !== req.user!.email) {
      return res.status(403).json({ error: 'Unauthorized to cancel this subscription' });
    }

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end
    });

    res.json({
      message: cancel_at_period_end
        ? 'Subscription will be canceled at the end of the current period'
        : 'Subscription canceled immediately',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        current_period_end: updatedSubscription.current_period_end
      }
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Reactivate subscription
router.post('/subscriptions/:subscriptionId/reactivate', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    // Verify the subscription belongs to the authenticated user
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if (typeof customer === 'string' || !('email' in customer) || customer.email !== req.user!.email) {
      return res.status(403).json({ error: 'Unauthorized to reactivate this subscription' });
    }

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });

    res.json({
      message: 'Subscription reactivated successfully',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        current_period_end: updatedSubscription.current_period_end
      }
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

// Get customer invoices
router.get('/invoices', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // Find customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.json({ invoices: [] });
    }

    const customer = customers.data[0];
    
    // Get customer's invoices
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: 50
    });

    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      created: invoice.created,
      due_date: invoice.due_date,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      period_start: invoice.period_start,
      period_end: invoice.period_end
    }));

    res.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get customer payment methods
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // Find customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.json({ payment_methods: [] });
    }

    const customer = customers.data[0];
    
    // Get customer's payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card'
    });

    const formattedPaymentMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year
      } : null,
      created: pm.created
    }));

    res.json({ payment_methods: formattedPaymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Create setup intent for adding new payment method
router.post('/setup-intent', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // Find or create customer
    let customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    let customer;
    if (customers.data.length === 0) {
      customer = await stripe.customers.create({
        email: userEmail
      });
    } else {
      customer = customers.data[0];
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session'
    });

    res.json({
      client_secret: setupIntent.client_secret,
      customer_id: customer.id
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: 'Failed to create setup intent' });
  }
});

// Delete payment method
router.delete('/payment-methods/:paymentMethodId', authenticateToken, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const userEmail = req.user.email;
    
    // Get payment method to verify ownership
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    if (!paymentMethod.customer) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    // Verify customer ownership
    const customer = await stripe.customers.retrieve(paymentMethod.customer as string);
    if (typeof customer === 'string' || !('email' in customer) || customer.email !== userEmail) {
      return res.status(403).json({ error: 'Unauthorized to delete this payment method' });
    }

    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// Get customer details
router.get('/customer', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // Find customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.json({ customer: null });
    }

    const customer = customers.data[0];
    
    res.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        created: customer.created,
        default_source: customer.default_source,
        invoice_prefix: customer.invoice_prefix
      }
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer details' });
  }
});

// Get payment tracking information for the authenticated user
router.get('/payment-tracking', authenticateToken, async (req, res) => {
  try {
    const { paymentTracker } = await import('../services/paymentTracker');
    const userEmail = req.user.email;
    
    // Get payments for this user
    const payments = await paymentTracker.getPaymentsByEmail(userEmail);
    
    // Format payments for frontend display
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      created: payment.created,
      description: payment.description,
      status: payment.status,
      type: payment.type,
      has_active_subscription: payment.has_active_subscription,
      subscription_status: payment.subscription_status,
      subscription_plan: payment.subscription_plan,
      next_payment_date: payment.next_payment_date,
      verification_status: payment.verification_status,
      invoice_number: payment.invoice_number
    }));

    // Get summary statistics
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const activeSubscriptions = payments.filter(p => p.has_active_subscription).length;
    const orphanedPayments = payments.filter(p => !p.has_active_subscription && p.verification_status === 'verified').length;
    
    res.json({
      payments: formattedPayments,
      summary: {
        total_payments: payments.length,
        total_amount_paid: totalPaid,
        active_subscriptions: activeSubscriptions,
        orphaned_payments: orphanedPayments,
        last_payment: payments.length > 0 ? payments[0].created : null
      }
    });
  } catch (error) {
    console.error('Error fetching payment tracking:', error);
    res.status(500).json({ error: 'Failed to fetch payment tracking information' });
  }
});

// Get subscription verification status for a specific payment
router.get('/payment-tracking/:paymentId/verify', authenticateToken, async (req, res) => {
  try {
    const { paymentTracker } = await import('../services/paymentTracker');
    const { paymentId } = req.params;
    const userEmail = req.user.email;
    
    // Get all payments for this user to verify ownership
    const userPayments = await paymentTracker.getPaymentsByEmail(userEmail);
    const payment = userPayments.find(p => p.id === paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found or not authorized' });
    }
    
    // Trigger verification for this payment
    await paymentTracker.verifyPaymentSubscriptionStatus(paymentId);
    
    // Get updated payment info
    const updatedPayments = await paymentTracker.getPaymentsByEmail(userEmail);
    const updatedPayment = updatedPayments.find(p => p.id === paymentId);
    
    res.json({
      payment: {
        id: updatedPayment?.id,
        has_active_subscription: updatedPayment?.has_active_subscription,
        subscription_status: updatedPayment?.subscription_status,
        subscription_plan: updatedPayment?.subscription_plan,
        next_payment_date: updatedPayment?.next_payment_date,
        verification_status: updatedPayment?.verification_status
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment subscription status' });
  }
});

// Stripe webhook endpoint - must be before other middleware that parses body
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Webhook signature verified:', event.type);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('💳 Payment succeeded:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          customer: paymentIntent.customer,
          receipt_email: paymentIntent.receipt_email
        });
        
        // Store payment information for tracking
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('📄 Invoice payment succeeded:', {
          id: invoice.id,
          amount_paid: invoice.amount_paid,
          customer: invoice.customer,
          customer_email: invoice.customer_email
        });
        
        // Store invoice payment information
        await handleInvoicePaymentSuccess(invoice);
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🔄 Subscription created:', {
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status
        });
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log('🔄 Subscription updated:', {
          id: updatedSubscription.id,
          customer: updatedSubscription.customer,
          status: updatedSubscription.status
        });
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('❌ Subscription deleted:', {
          id: deletedSubscription.id,
          customer: deletedSubscription.customer
        });
        break;

      default:
        console.log(`🔔 Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper function to handle successful payments
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { paymentTracker } = await import('../services/paymentTracker');
    
    // Get customer details if customer ID is available
    let customerEmail = paymentIntent.receipt_email;
    
    if (paymentIntent.customer && typeof paymentIntent.customer === 'string') {
      const customer = await stripe.customers.retrieve(paymentIntent.customer);
      if (typeof customer !== 'string' && !customer.deleted && 'email' in customer && customer.email) {
        customerEmail = customer.email;
      }
    }

    const paymentData = {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      customer_id: paymentIntent.customer as string | null,
      customer_email: customerEmail,
      created: paymentIntent.created,
      description: paymentIntent.description,
      receipt_email: paymentIntent.receipt_email,
      status: paymentIntent.status,
      type: 'payment_intent' as const
    };

    // Store payment data using payment tracker
    await paymentTracker.storeWebhookPayment(paymentData);
    
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
  }
}

// Helper function to handle successful invoice payments
async function handleInvoicePaymentSuccess(invoice: Stripe.Invoice) {
  try {
    const { paymentTracker } = await import('../services/paymentTracker');
    
    const paymentData = {
      id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency || 'usd',
      customer_id: invoice.customer as string | null,
      customer_email: invoice.customer_email,
      created: invoice.created,
      description: `Invoice ${invoice.number}`,
      receipt_email: invoice.customer_email,
      status: invoice.status || 'succeeded',
      type: 'invoice' as const,
      invoice_number: invoice.number,
      subscription_id: invoice.subscription as string | null
    };

    // Store invoice payment data using payment tracker
    await paymentTracker.storeWebhookPayment(paymentData);
    
  } catch (error) {
    console.error('❌ Error handling invoice payment success:', error);
  }
}

export { router as stripeRoutes };
