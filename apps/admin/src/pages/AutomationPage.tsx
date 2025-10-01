import { useEffect, useState } from 'react'
import { useAdmin } from '../contexts/AdminContext'
import { Zap, Clock, Mail, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const AutomationPage = () => {
  const { automationRules, fetchAutomationRules, createAutomationRule, loading } = useAdmin()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    trigger: 'subscription_ending' as 'subscription_ending' | 'subscription_cancelled' | 'payment_failed' | 'new_customer',
    triggerDays: 3,
    emailTemplate: ''
  })

  useEffect(() => {
    fetchAutomationRules()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createAutomationRule(formData)
      toast.success('Automation rule created successfully!')
      setShowCreateForm(false)
      setFormData({
        name: '',
        trigger: 'subscription_ending',
        triggerDays: 3,
        emailTemplate: ''
      })
      fetchAutomationRules()
    } catch (error) {
      toast.error('Failed to create automation rule')
    }
  }

  const getTriggerColor = (trigger: string) => {
    const colors = {
      subscription_ending: 'bg-yellow-100 text-yellow-800',
      subscription_cancelled: 'bg-red-100 text-red-800',
      payment_failed: 'bg-orange-100 text-orange-800',
      new_customer: 'bg-green-100 text-green-800'
    }
    return colors[trigger as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTriggerLabel = (trigger: string) => {
    const labels = {
      subscription_ending: 'Subscription Ending',
      subscription_cancelled: 'Subscription Cancelled',
      payment_failed: 'Payment Failed',
      new_customer: 'New Customer'
    }
    return labels[trigger as keyof typeof labels] || trigger
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Automation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up automated email triggers based on customer actions
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Rule
        </button>
      </div>

      {/* Automation Rules */}
      <div className="grid gap-6">
        {automationRules.map((rule) => (
          <div key={rule.id} className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-laurx-500" />
                    <h3 className="text-lg font-medium text-gray-900">{rule.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTriggerColor(rule.trigger)}`}>
                      {getTriggerLabel(rule.trigger)}
                    </span>
                    {rule.isActive ? (
                      <span className="badge-success">Active</span>
                    ) : (
                      <span className="badge-neutral">Inactive</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    {rule.triggerDays && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {rule.triggerDays} days before
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email template configured
                    </span>
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">{rule.emailTemplate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    Created {new Date(rule.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Rule Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Automation Rule</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Rule Name</label>
                <input
                  type="text"
                  required
                  className="input mt-1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trigger Event</label>
                <select
                  className="select mt-1"
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value as any })}
                >
                  <option value="subscription_ending">Subscription Ending</option>
                  <option value="subscription_cancelled">Subscription Cancelled</option>
                  <option value="payment_failed">Payment Failed</option>
                  <option value="new_customer">New Customer</option>
                </select>
              </div>
              {formData.trigger === 'subscription_ending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Days Before Renewal</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="input mt-1"
                    value={formData.triggerDays}
                    onChange={(e) => setFormData({ ...formData, triggerDays: parseInt(e.target.value) })}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Template</label>
                <textarea
                  required
                  rows={6}
                  className="textarea mt-1"
                  value={formData.emailTemplate}
                  onChange={(e) => setFormData({ ...formData, emailTemplate: e.target.value })}
                  placeholder="Enter your email template here..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {automationRules.length === 0 && (
        <div className="text-center py-12">
          <Zap className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No automation rules</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first automation rule to engage customers automatically.
          </p>
        </div>
      )}
    </div>
  )
}

export default AutomationPage
