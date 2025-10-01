import { useEffect } from 'react'
import { useAdmin } from '../contexts/AdminContext'
import { TrendingUp, Users, DollarSign, Mail, Activity, Calendar } from 'lucide-react'

const AnalyticsPage = () => {
  const { analytics, fetchAnalytics, loading } = useAdmin()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your business performance and customer engagement
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {analytics.totalCustomers.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Customers</div>
                <div className="text-xs text-green-600 mt-1">+12% from last month</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {analytics.activeSubscriptions.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Active Subscriptions</div>
                <div className="text-xs text-green-600 mt-1">+8% from last month</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <div className="text-2xl font-semibold text-gray-900">
                  ${analytics.monthlyRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Monthly Revenue</div>
                <div className="text-xs text-green-600 mt-1">+15% from last month</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {analytics.churnRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Churn Rate</div>
                <div className="text-xs text-green-600 mt-1">-2% from last month</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Performance */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Email Campaign Performance</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Mail className="h-12 w-12 text-laurx-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">
                {analytics.emailStats.campaignsSent}
              </div>
              <div className="text-sm text-gray-500">Campaigns Sent</div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">
                {analytics.emailStats.averageOpenRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Average Open Rate</div>
            </div>
            <div className="text-center">
              <Activity className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">
                {analytics.emailStats.averageClickRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Average Click Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Recent Activity</h3>
        </div>
        <div className="card-content">
          <div className="flow-root">
            <ul className="-mb-8">
              {analytics.recentActivity.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== analytics.recentActivity.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-laurx-500 flex items-center justify-center ring-8 ring-white">
                          <Activity className="h-4 w-4 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {activity.description}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Customer Growth</h3>
          </div>
          <div className="card-content">
            <div className="text-center py-8">
              <TrendingUp className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <div className="text-2xl font-bold text-gray-900 mb-2">
                Growing Steadily
              </div>
              <p className="text-gray-500">
                Your customer base is growing at a healthy rate with good retention.
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Revenue Trends</h3>
          </div>
          <div className="card-content">
            <div className="text-center py-8">
              <DollarSign className="h-16 w-16 text-purple-500 mx-auto mb-4" />
              <div className="text-2xl font-bold text-gray-900 mb-2">
                Strong Performance
              </div>
              <p className="text-gray-500">
                Monthly recurring revenue is trending upward with consistent growth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
