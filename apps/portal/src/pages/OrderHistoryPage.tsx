import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { ExternalLink, Tag, Gift } from 'lucide-react';

interface Order {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  receiptUrl: string | null;
  invoiceNumber?: string;
  type: 'charge' | 'invoice';
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: string;
  amount: number;
  interval: string;
}

interface AppliedCoupon {
  subscriptionId: string;
  couponId: string;
  couponCode: string;
  percentOff: number | null;
  amountOff: number | null;
  duration: string;
  validUntil: string | null;
}

interface AvailableCoupon {
  id: string;
  code: string;
  percentOff: number | null;
  amountOff: number | null;
  duration: string;
  durationInMonths: number | null;
  redeemBy: string | null;
}

interface OrderHistoryData {
  orders: Order[];
  subscriptions: Subscription[];
  appliedCoupons: AppliedCoupon[];
  availableCoupons: AvailableCoupon[];
  totalSpent: number;
}

const OrderHistoryPage = () => {
  const { token } = useAuth();
  const [data, setData] = useState<OrderHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/portal/order-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order history');
      }

      const orderData = await response.json();
      setData(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'succeeded': 'bg-green-100 text-green-800',
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-gray-100 text-gray-800'
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
            <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
            <p className="text-gray-600">View your orders and transactions</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchOrderHistory}
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

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-600">View your orders, subscriptions, and coupons</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(data.totalSpent, 'usd')}
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
                <p className="text-2xl font-bold text-gray-900">
                  {data.subscriptions.filter(s => s.status === 'active').length}
                </p>
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
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{data.orders.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applied Coupons */}
      {data.appliedCoupons.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Tag className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Applied Coupons</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">Discounts currently active on your subscriptions</p>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {data.appliedCoupons.map((coupon) => (
                <div key={coupon.subscriptionId} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{coupon.couponCode}</p>
                    <p className="text-sm text-gray-600">
                      {coupon.percentOff ? `${coupon.percentOff}% off` : `$${coupon.amountOff} off`}
                      {' · '}
                      {coupon.duration === 'forever' ? 'Forever' :
                       coupon.duration === 'once' ? 'One-time' :
                       `For ${coupon.duration}`}
                    </p>
                  </div>
                  {coupon.validUntil && (
                    <p className="text-sm text-gray-500">
                      Valid until {formatDate(coupon.validUntil)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Available Coupons */}
      {data.availableCoupons.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Gift className="h-5 w-5 text-purple-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Available Coupons</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">Use these codes when making your next purchase</p>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.availableCoupons.map((coupon) => (
                <div key={coupon.id} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono font-bold text-lg text-purple-900">{coupon.code}</p>
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-600 text-white">
                      {coupon.percentOff ? `${coupon.percentOff}% OFF` : `$${coupon.amountOff} OFF`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {coupon.duration === 'forever' ? 'Valid forever' :
                     coupon.duration === 'once' ? 'One-time use' :
                     `Valid for ${coupon.durationInMonths} months`}
                  </p>
                  {coupon.redeemBy && (
                    <p className="text-xs text-red-600 mt-1">
                      Expires: {formatDate(coupon.redeemBy)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Subscriptions */}
      {data.subscriptions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Active Subscriptions</h2>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {data.subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{sub.plan}</p>
                    <p className="text-sm text-gray-600">
                      {formatAmount(sub.amount, 'usd')} / {sub.interval}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(sub.status)}
                    <p className="text-sm text-gray-500 mt-1">
                      Next billing: {formatDate(sub.currentPeriodEnd)}
                    </p>
                    {sub.cancelAtPeriodEnd && (
                      <p className="text-sm text-red-600 mt-1">
                        Cancels at period end
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Order History Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
        </div>
        <div className="card-content">
          {data.orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No orders found</p>
              <p className="text-sm text-gray-400 mt-2">
                Your order history will appear here once you make your first purchase.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {order.description}
                          </div>
                          {order.invoiceNumber && (
                            <div className="text-sm text-gray-500">
                              Invoice: {order.invoiceNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(order.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatAmount(order.amount, order.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {order.receiptUrl ? (
                          <a
                            href={order.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-900 flex items-center"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </a>
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
    </div>
  );
};

export default OrderHistoryPage;
