import { useEffect, useState } from 'react'
import { useAdmin } from '../contexts/AdminContext'
import { Mail, Send, Users, Eye, MousePointer } from 'lucide-react'
import toast from 'react-hot-toast'

const EmailCampaignsPage = () => {
  const { emailCampaigns, fetchEmailCampaigns, sendEmailCampaign, loading } = useAdmin()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'custom' as 'thank_you' | 'renewal_reminder' | 'custom' | 'coupon',
    recipients: 'all' as 'all' | 'active_subscribers'
  })

  useEffect(() => {
    fetchEmailCampaigns()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await sendEmailCampaign({
        ...formData,
        recipients: formData.recipients as any
      })
      toast.success('Email campaign sent successfully!')
      setShowCreateForm(false)
      setFormData({
        name: '',
        subject: '',
        content: '',
        type: 'custom',
        recipients: 'all'
      })
      fetchEmailCampaigns()
    } catch (error) {
      toast.error('Failed to send email campaign')
    }
  }

  const getTypeColor = (type: string) => {
    const colors = {
      thank_you: 'bg-green-100 text-green-800',
      renewal_reminder: 'bg-yellow-100 text-yellow-800',
      custom: 'bg-blue-100 text-blue-800',
      coupon: 'bg-purple-100 text-purple-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage email campaigns for your customers
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          <Send className="h-4 w-4 mr-2" />
          New Campaign
        </button>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {emailCampaigns.length}
                </div>
                <div className="text-sm text-gray-500">Total Campaigns</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {emailCampaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / emailCampaigns.length || 0}%
                </div>
                <div className="text-sm text-gray-500">Avg Open Rate</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <MousePointer className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {emailCampaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / emailCampaigns.length || 0}%
                </div>
                <div className="text-sm text-gray-500">Avg Click Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Recent Campaigns</h3>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            {emailCampaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(campaign.type)}`}>
                        {campaign.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{campaign.subject}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span><Users className="h-4 w-4 inline mr-1" />{campaign.recipients} recipients</span>
                      {campaign.openRate && (
                        <span><Eye className="h-4 w-4 inline mr-1" />{campaign.openRate}% opened</span>
                      )}
                      {campaign.clickRate && (
                        <span><MousePointer className="h-4 w-4 inline mr-1" />{campaign.clickRate}% clicked</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{campaign.status}</div>
                    <div className="text-sm text-gray-500">
                      {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : 'Not sent'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Email Campaign</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                <input
                  type="text"
                  required
                  className="input mt-1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject Line</label>
                <input
                  type="text"
                  required
                  className="input mt-1"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Campaign Type</label>
                <select
                  className="select mt-1"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="custom">Custom</option>
                  <option value="thank_you">Thank You</option>
                  <option value="renewal_reminder">Renewal Reminder</option>
                  <option value="coupon">Coupon</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Recipients</label>
                <select
                  className="select mt-1"
                  value={formData.recipients}
                  onChange={(e) => setFormData({ ...formData, recipients: e.target.value as any })}
                >
                  <option value="all">All Customers</option>
                  <option value="active_subscribers">Active Subscribers Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Content</label>
                <textarea
                  required
                  rows={8}
                  className="textarea mt-1"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter your email content here..."
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
                  Send Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {emailCampaigns.length === 0 && (
        <div className="text-center py-12">
          <Mail className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first email campaign to engage with customers.
          </p>
        </div>
      )}
    </div>
  )
}

export default EmailCampaignsPage
