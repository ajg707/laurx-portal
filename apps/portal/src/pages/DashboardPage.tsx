import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  Package, 
  CreditCard, 
  History, 
  HelpCircle,
  Calendar,
  DollarSign
} from 'lucide-react'

interface DashboardData {
  user: {
    email: string
    name: string
    joinDate: string
    preferences: {
      emailNotifications: boolean
      smsNotifications: boolean
      marketingEmails: boolean
    }
  }
  stats: {
    totalOrders: number
    activeSubscriptions: number
    totalSaved: number
    nextDelivery: string | null
  }
  quickActions: Array<{
    id: string
    title: string
    description: string
    icon: string
    url: string
  }>
}

const DashboardPage = () => {
  const { token } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/portal/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const data = await response.json()
        setDashboardData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchDashboardData()
    }
  }, [token, API_BASE_URL])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">
          Error loading dashboard: {error}
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No dashboard data available</p>
      </div>
    )
  }

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'subscription':
        return Package
      case 'payment':
        return CreditCard
      case 'history':
        return History
      case 'support':
        return HelpCircle
      default:
        return Package
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-laurx-600 to-laurx-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {dashboardData.user.name}!
        </h1>
        <p className="text-laurx-100">
          Manage your LAURx subscriptions and account settings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content py-8">
            <div className="flex items-center justify-center h-full">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-laurx-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats.activeSubscriptions}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content py-8">
            <div className="flex items-center justify-center h-full">
              <div className="flex-shrink-0">
                <History className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats.totalOrders}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content py-8">
            <div className="flex items-center justify-center h-full">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Saved</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(dashboardData.stats.totalSaved / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content py-8">
            <div className="flex items-center justify-center h-full">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Next Delivery</p>
                <p className="text-lg font-bold text-gray-900">
                  {dashboardData.stats.nextDelivery ? 
                    new Date(dashboardData.stats.nextDelivery).toLocaleDateString() : 
                    'None scheduled'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-600">Manage your account and subscriptions</p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.quickActions.map((action) => {
              const IconComponent = getIconComponent(action.icon)
              return (
                <a
                  key={action.id}
                  href={action.url}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-laurx-300 hover:bg-laurx-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <IconComponent className="h-6 w-6 text-laurx-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
          </div>
          <div className="card-content">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{dashboardData.user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(dashboardData.user.joinDate).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
          </div>
          <div className="card-content">
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Email Notifications</dt>
                <dd className="text-sm">
                  <span className={`badge ${dashboardData.user.preferences.emailNotifications ? 'badge-success' : 'badge-neutral'}`}>
                    {dashboardData.user.preferences.emailNotifications ? 'Enabled' : 'Disabled'}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">SMS Notifications</dt>
                <dd className="text-sm">
                  <span className={`badge ${dashboardData.user.preferences.smsNotifications ? 'badge-success' : 'badge-neutral'}`}>
                    {dashboardData.user.preferences.smsNotifications ? 'Enabled' : 'Disabled'}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Marketing Emails</dt>
                <dd className="text-sm">
                  <span className={`badge ${dashboardData.user.preferences.marketingEmails ? 'badge-success' : 'badge-neutral'}`}>
                    {dashboardData.user.preferences.marketingEmails ? 'Enabled' : 'Disabled'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
