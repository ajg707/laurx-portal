import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, CheckCircle, HelpCircle, DollarSign, XCircle, CreditCard } from 'lucide-react';

const SupportPage = () => {
  const { token } = useAuth();
  const [requestType, setRequestType] = useState<'refund' | 'cancellation' | 'payment_method' | 'general'>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [subscriptionId, setSubscriptionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    // Fetch user's subscriptions and orders for the dropdowns
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/portal/order-history`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSubscriptions(data.subscriptions || []);
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/portal/support/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: requestType,
          subject,
          message,
          orderId: orderId || undefined,
          subscriptionId: subscriptionId || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit support request');
      }

      setSubmitSuccess(true);
      setSubject('');
      setMessage('');
      setOrderId('');
      setSubscriptionId('');
      setRequestType('general');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-600">Get help with your LAURx account</p>
        </div>
      </div>

      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-green-900">Request Submitted Successfully</h3>
            <p className="text-sm text-green-700 mt-1">
              We've received your request and will respond within 24-48 hours. You'll receive a confirmation email shortly.
            </p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-900">Submission Failed</h3>
            <p className="text-sm text-red-700 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Support Request Form */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Submit a Support Request</h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose a request type and provide details. We'll get back to you as soon as possible.
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Request Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => setRequestType('general')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    requestType === 'general'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <HelpCircle className={`h-6 w-6 mb-2 ${requestType === 'general' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <h3 className="font-medium text-gray-900">General Support</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Questions or general assistance
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('refund')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    requestType === 'refund'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <DollarSign className={`h-6 w-6 mb-2 ${requestType === 'refund' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <h3 className="font-medium text-gray-900">Request Refund</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Request a refund for an order
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('cancellation')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    requestType === 'cancellation'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <XCircle className={`h-6 w-6 mb-2 ${requestType === 'cancellation' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <h3 className="font-medium text-gray-900">Cancel Subscription</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Request subscription cancellation
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('payment_method')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    requestType === 'payment_method'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className={`h-6 w-6 mb-2 ${requestType === 'payment_method' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <h3 className="font-medium text-gray-900">Update Payment</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Change payment method
                  </p>
                </button>
              </div>
            </div>

            {/* Order Selection (for refunds) */}
            {requestType === 'refund' && orders.length > 0 && (
              <div>
                <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Order (Optional)
                </label>
                <select
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Choose an order...</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.description} - ${order.amount} - {new Date(order.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Subscription Selection (for cancellations) */}
            {requestType === 'cancellation' && subscriptions.length > 0 && (
              <div>
                <label htmlFor="subscriptionId" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Subscription (Optional)
                </label>
                <select
                  id="subscriptionId"
                  value={subscriptionId}
                  onChange={(e) => setSubscriptionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Choose a subscription...</option>
                  {subscriptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.plan} - ${sub.amount}/{sub.interval} - {sub.status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={
                  requestType === 'refund' ? 'Refund request for order...' :
                  requestType === 'cancellation' ? 'Subscription cancellation request' :
                  requestType === 'payment_method' ? 'Payment method update request' :
                  'Brief description of your issue'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                {requestType === 'cancellation' ? 'Cancellation Reason' :
                 requestType === 'payment_method' ? 'New Payment Details' : 'Message'} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  requestType === 'refund' ? 'Please explain why you are requesting a refund...' :
                  requestType === 'cancellation' ? 'Please let us know why you want to cancel...' :
                  requestType === 'payment_method' ? 'Describe what payment method you would like to use (our team will contact you securely to complete the change)...' :
                  'Provide details about your request or question...'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !subject || !message}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Contact Support</h2>
          </div>
          <div className="card-content">
            <p className="text-gray-600 mb-4">
              Need immediate assistance? Reach out directly to our support team.
            </p>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Email:</span>{' '}
                <a href="mailto:support@mylaurelrose.com" className="text-laurx-600 hover:text-laurx-700">
                  support@mylaurelrose.com
                </a>
              </p>
              <p className="text-sm">
                <span className="font-medium">Hours:</span> Monday - Friday, 9 AM - 5 PM EST
              </p>
              <p className="text-sm">
                <span className="font-medium">Response Time:</span> Within 24-48 hours
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">How do I modify my subscription?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Visit the Subscriptions page to manage your active subscriptions.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">What is your refund policy?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  We offer refunds within 30 days of purchase. Submit a refund request above for review.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">How do I cancel my subscription?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Submit a cancellation request above, and our team will process it within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
