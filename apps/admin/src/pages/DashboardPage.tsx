import { useEffect } from 'react'
import { useAdmin } from '../contexts/AdminContext'
import { Users, DollarSign, Mail, TrendingUp, Activity } from 'lucide-react'

const DashboardPage = () => {
  const { analytics, fetchAnalytics, loading } = useAdmin()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const stats = [
    {
      name: 'Total Customers',
      value: analytics.totalCustomers.toLocaleString(),
      icon: Users,
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      name: 'Active Subscriptions',
      value: analytics.activeSubscriptions.toLocaleString(),
      icon: TrendingUp,
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      name: 'Monthly Revenue',
      value: `$${analytics.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: '+15%',
      changeType: 'positive' as const,
    },
    {
      name: 'Churn Rate',
      value: `${analytics.churnRate.toFixed(1)}%`,
      icon: Activity,
      change: '-2%',
      changeType: 'positive' as const,
    },
  ]

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your customer portal and subscription metrics
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Email Stats */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Email Campaign Performance
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-gray-50 px-4 py-5 rounded-lg">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-laurx-500" />
                <div className="ml-4">
                  <div className="text-2xl font-semibold text-gray-900">
                    {analytics.emailStats.campaignsSent}
                  </div>
                  <div className="text-sm text-gray-500">Campaigns Sent</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-5 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <div className="text-2xl font-semibold text-gray-900">
                    {analytics.emailStats.averageOpenRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Avg Open Rate</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-5 rounded-lg">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <div className="text-2xl font-semibold text-gray-900">
                    {analytics.emailStats.averageClickRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Avg Click Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
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
                          {new Date(activity.timestamp).toLocaleDateString()}
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
    </div>
  )
}

export default DashboardPage
