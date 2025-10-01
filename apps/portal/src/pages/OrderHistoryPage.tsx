import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  created: number;
  description: string | null;
  status: string;
  type: 'payment_intent' | 'invoice';
  has_active_subscription?: boolean;
  subscription_status?: string;
  subscription_plan?: string;
  next_payment_date?: number | null;
  verification_status?: 'pending' | 'verified' | 'no_subscription' | 'error';
  invoice_number?: string;
}

interface PaymentSummary {
  total_payments: number;
  total_amount_paid: number;
  active_subscriptions: number;
  orphaned_payments: number;
  last_payment: number | null;
}

const OrderHistoryPage = () => {
  const { token } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentTracking();
  }, []);

  const fetchPaymentTracking = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/payment-tracking', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment tracking');
      }

      const data = await response.json();
      setPayments(data.payments || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const verifyPaymentSubscription = async (paymentId: string) => {
    try {
      setVerifyingPayment(paymentId);
      const response = await fetch(`/api/stripe/payment-tracking/${paymentId}/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment subscription');
      }

      // Refresh the payment tracking data
      await fetchPaymentTracking();
    } catch (err) {
      console.error('Error verifying payment:', err);
    } finally {
      setVerifyingPayment(null);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (payment: PaymentRecord) => {
    if (payment.verification_status === 'pending') {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Verifying...</span>;
    }
    
    if (payment.has_active_subscription) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active Subscription</span>;
    }
    
    if (payment.verification_status === 'no_subscription') {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">No Active Subscription</span>;
    }
    
    if (payment.verification_status === 'error') {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Verification Error</span>;
    }
    
    return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Paid</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-600">View your payment history and subscription status</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <button 
                onClick={fetchPaymentTracking}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600">View your payment history and subscription verification status</p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(summary.total_amount_paid, 'usd')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.active_subscriptions}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total_payments}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Orphaned Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.orphaned_payments}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Table */}
      <div className="card">
        <div className="card-content">
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No payment history found</p>
              <p className="text-sm text-gray-400 mt-2">
                Your payment history will appear here once you make your first payment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscription Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.description || `${payment.type === 'invoice' ? 'Invoice' : 'Payment'} ${payment.id.substring(0, 8)}...`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.invoice_number && `Invoice: ${payment.invoice_number}`}
                          </div>
                          {payment.subscription_plan && (
                            <div className="text-sm text-purple-600 font-medium">
                              {payment.subscription_plan}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatAmount(payment.amount, payment.currency)}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {payment.type.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.created)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment)}
                        {payment.subscription_status && (
                          <div className="text-xs text-gray-500 mt-1 capitalize">
                            {payment.subscription_status}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.next_payment_date ? (
                          <div>
                            <div className="font-medium">
                              {formatDate(payment.next_payment_date)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Next billing
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {payment.verification_status === 'pending' || payment.verification_status === 'error' ? (
                          <button
                            onClick={() => verifyPaymentSubscription(payment.id)}
                            disabled={verifyingPayment === payment.id}
                            className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                          >
                            {verifyingPayment === payment.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                                Verifying...
                              </div>
                            ) : (
                              'Verify Subscription'
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="card">
        <div className="card-content">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  About Payment Tracking
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    This page shows your payment history and verifies whether each payment has an active subscription. 
                    "Orphaned payments" are payments that don't have an active subscription - these may need attention.
                  </p>
                  <p className="mt-2">
                    Click "Verify Subscription" to check the current status of any payment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
