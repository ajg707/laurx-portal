import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface AdminContextType {
  customers: Customer[]
  emailCampaigns: EmailCampaign[]
  automationRules: AutomationRule[]
  coupons: Coupon[]
  analytics: Analytics
  loading: boolean
  error: string | null
  fetchCustomers: () => Promise<void>
  fetchEmailCampaigns: () => Promise<void>
  fetchAutomationRules: () => Promise<void>
  fetchCoupons: () => Promise<void>
  fetchAnalytics: () => Promise<void>
  sendEmailCampaign: (campaign: Partial<EmailCampaign>) => Promise<void>
  createAutomationRule: (rule: Partial<AutomationRule>) => Promise<void>
  createCoupon: (coupon: Partial<Coupon>) => Promise<void>
  applyCouponToCustomer: (customerId: string, couponId: string) => Promise<void>
}

interface Customer {
  id: string
  email: string
  name: string
  subscriptions: Subscription[]
  totalSpent: number
  createdAt: string
  lastOrderDate?: string
  status: 'active' | 'inactive' | 'churned'
}

interface Subscription {
  id: string
  status: string
  currentPeriodEnd: string
  product: string
  price: number
  interval: string
}

interface EmailCampaign {
  id: string
  name: string
  subject: string
  content: string
  type: 'thank_you' | 'renewal_reminder' | 'custom' | 'coupon'
  status: 'draft' | 'sent' | 'scheduled'
  sentAt?: string
  scheduledAt?: string
  recipients: number
  openRate?: number
  clickRate?: number
}

interface AutomationRule {
  id: string
  name: string
  trigger: 'subscription_ending' | 'subscription_cancelled' | 'payment_failed' | 'new_customer'
  triggerDays?: number
  emailTemplate: string
  isActive: boolean
  createdAt: string
}

interface Coupon {
  id: string
  code: string
  type: 'percent' | 'amount'
  value: number
  description: string
  expiresAt?: string
  maxUses?: number
  usedCount: number
  isActive: boolean
  createdAt: string
}

interface Analytics {
  totalCustomers: number
  activeSubscriptions: number
  monthlyRevenue: number
  churnRate: number
  emailStats: {
    campaignsSent: number
    averageOpenRate: number
    averageClickRate: number
  }
  recentActivity: ActivityItem[]
}

interface ActivityItem {
  id: string
  type: 'email_sent' | 'subscription_created' | 'coupon_used' | 'automation_triggered'
  description: string
  timestamp: string
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}

interface AdminProviderProps {
  children: ReactNode
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const { token } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([])
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [analytics, setAnalytics] = useState<Analytics>({
    totalCustomers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    churnRate: 0,
    emailStats: {
      campaignsSent: 0,
      averageOpenRate: 0,
      averageClickRate: 0,
    },
    recentActivity: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = 'http://localhost:3001'

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'API request failed')
    }

    return response.json()
  }

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiCall('/api/admin/customers')
      setCustomers(data.customers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmailCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiCall('/api/admin/email-campaigns')
      setEmailCampaigns(data.campaigns)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch email campaigns')
    } finally {
      setLoading(false)
    }
  }

  const fetchAutomationRules = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiCall('/api/admin/automation-rules')
      setAutomationRules(data.rules)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch automation rules')
    } finally {
      setLoading(false)
    }
  }

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiCall('/api/admin/coupons')
      setCoupons(data.coupons)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch coupons')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiCall('/api/admin/analytics')
      setAnalytics(data.analytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const sendEmailCampaign = async (campaign: Partial<EmailCampaign>) => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiCall('/api/admin/email-campaigns', {
        method: 'POST',
        body: JSON.stringify(campaign),
      })
      setEmailCampaigns(prev => [...prev, data.campaign])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email campaign')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const createAutomationRule = async (rule: Partial<AutomationRule>) => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiCall('/api/admin/automation-rules', {
        method: 'POST',
        body: JSON.stringify(rule),
      })
      setAutomationRules(prev => [...prev, data.rule])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create automation rule')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const createCoupon = async (coupon: Partial<Coupon>) => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiCall('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(coupon),
      })
      setCoupons(prev => [...prev, data.coupon])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create coupon')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const applyCouponToCustomer = async (customerId: string, couponId: string) => {
    try {
      setLoading(true)
      setError(null)
      await apiCall(`/api/admin/customers/${customerId}/apply-coupon`, {
        method: 'POST',
        body: JSON.stringify({ couponId }),
      })
      // Refresh customers data
      await fetchCustomers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply coupon')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const value = {
    customers,
    emailCampaigns,
    automationRules,
    coupons,
    analytics,
    loading,
    error,
    fetchCustomers,
    fetchEmailCampaigns,
    fetchAutomationRules,
    fetchCoupons,
    fetchAnalytics,
    sendEmailCampaign,
    createAutomationRule,
    createCoupon,
    applyCouponToCustomer,
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}
