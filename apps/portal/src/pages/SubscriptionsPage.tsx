import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { Package, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: string;
  amount: number;
  interval: string;
}

const SubscriptionsPage = () => {
  const { token } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/portal/order-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'trialing': 'bg-blue-100 text-blue-800',
      'past_due': 'bg-yellow-100 text-yellow-800',
      'canceled': 'bg-gray-100 text-gray-800',
      'unpaid': 'bg-red-100 text-red-800'
    };

    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colorClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-gray-600">Manage your LAURx subscriptions</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
              <p className="text-red-500 mt-4">{error}</p>
              <button
                onClick={fetchSubscriptions}
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
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600">Manage your LAURx subscriptions</p>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="card">
          <div className="card-content">
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Active Subscriptions</h3>
              <p className="text-sm text-gray-500 mt-2">
                You don't have any active subscriptions yet.
              </p>
              <a
                href="https://mylaurelrose.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Browse Products
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {subscriptions.map((subscription) => (
            <div key={subscription.id} className="card">
              <div className="card-content">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{subscription.plan}</h3>
                      <p className="text-sm text-gray-500 mt-1">Subscription ID: {subscription.id}</p>
                      <div className="mt-2">
                        {getStatusBadge(subscription.status)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${subscription.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">per {subscription.interval}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Next Billing Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {subscription.cancelAtPeriodEnd ? (
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-xs text-gray-500">Cancellation</p>
                        <p className="text-sm font-medium text-yellow-600">
                          Ends on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500">Auto-Renewal</p>
                        <p className="text-sm font-medium text-green-600">Active</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Billing Amount</p>
                      <p className="text-sm font-medium text-gray-900">
                        ${subscription.amount.toFixed(2)}/{subscription.interval}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/support"
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Update Payment Method
                    </a>
                    {!subscription.cancelAtPeriodEnd && (
                      <a
                        href="/support"
                        className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                      >
                        Request Cancellation
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    To make changes to your subscription, please contact our support team.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card bg-blue-50 border-blue-200">
        <div className="card-content">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900">Need Help?</h3>
              <p className="text-sm text-blue-700 mt-1">
                If you need to make changes to your subscription, update your payment method, or have any questions,
                please visit our <a href="/support" className="underline font-medium">Support page</a> to submit a request.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsPage;
