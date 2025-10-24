import { useEffect, useState } from 'react'
import { useAdmin } from '../contexts/AdminContext'
import { Mail, Send, Users, Eye, MousePointer, X, Search, Code, Type, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

interface CustomerGroup {
  id: string
  name: string
  description: string
  customerCount?: number
}

interface Customer {
  id: string
  email: string
  name: string
  subscriptions?: Array<{ status: string }>
}

const EmailCampaignsPage = () => {
  const { emailCampaigns, fetchEmailCampaigns, sendEmailCampaign, loading } = useAdmin()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState<string | null>(null)
  const [editorMode, setEditorMode] = useState<'rich' | 'html'>('rich')
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    htmlContent: '',
    type: 'custom' as 'thank_you' | 'renewal_reminder' | 'custom' | 'coupon',
    recipientType: 'all' as 'all' | 'active_subscribers' | 'groups' | 'specific_customers',
    selectedGroupIds: [] as string[],
    selectedCustomerIds: [] as string[],
    enableTracking: true
  })
  const [groups, setGroups] = useState<CustomerGroup[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  useEffect(() => {
    fetchEmailCampaigns()
    fetchGroups()
    fetchCustomers()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/groups`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/customers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const getRecipientCount = () => {
    if (formData.recipientType === 'all') {
      return customers.length
    } else if (formData.recipientType === 'active_subscribers') {
      return customers.filter(c => c.subscriptions?.some((s: any) => s.status === 'active')).length
    } else if (formData.recipientType === 'groups') {
      const selectedGroups = groups.filter(g => formData.selectedGroupIds.includes(g.id))
      return selectedGroups.reduce((sum, g) => sum + (g.customerCount || 0), 0)
    } else if (formData.recipientType === 'specific_customers') {
      return formData.selectedCustomerIds.length
    }
    return 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate recipient selection
    if (formData.recipientType === 'groups' && formData.selectedGroupIds.length === 0) {
      toast.error('Please select at least one group')
      return
    }
    if (formData.recipientType === 'specific_customers' && formData.selectedCustomerIds.length === 0) {
      toast.error('Please select at least one customer')
      return
    }

    try {
      const campaignData = {
        ...formData,
        content: editorMode === 'html' ? formData.htmlContent : formData.content,
        recipients: formData.recipientType as any
      }

      console.log('Sending campaign data:', campaignData)
      await sendEmailCampaign(campaignData)
      toast.success('Email campaign sent successfully!')
      setShowCreateForm(false)
      setFormData({
        name: '',
        subject: '',
        content: '',
        htmlContent: '',
        type: 'custom',
        recipientType: 'all',
        selectedGroupIds: [],
        selectedCustomerIds: [],
        enableTracking: true
      })
      setEditorMode('rich')
      // Don't fetch campaigns here - the campaign is already added to state by sendEmailCampaign
      // fetchEmailCampaigns() would overwrite it with backend data (which may be empty if not persisted)
    } catch (error) {
      console.error('Email campaign error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email campaign'
      toast.error(errorMessage)
    }
  }

  const toggleGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedGroupIds: prev.selectedGroupIds.includes(groupId)
        ? prev.selectedGroupIds.filter(id => id !== groupId)
        : [...prev.selectedGroupIds, groupId]
    }))
  }

  const toggleCustomer = (customerId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCustomerIds: prev.selectedCustomerIds.includes(customerId)
        ? prev.selectedCustomerIds.filter(id => id !== customerId)
        : [...prev.selectedCustomerIds, customerId]
    }))
  }

  const filteredCustomers = customers.filter(c =>
    c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.name?.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const getTypeColor = (type: string) => {
    const colors = {
      thank_you: 'bg-green-100 text-green-800',
      renewal_reminder: 'bg-yellow-100 text-yellow-800',
      custom: 'bg-blue-100 text-blue-800',
      coupon: 'bg-purple-100 text-purple-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ]
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
                  {Math.round(emailCampaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / emailCampaigns.length) || 0}%
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
                  {Math.round(emailCampaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / emailCampaigns.length) || 0}%
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
                      {campaign.openRate !== undefined && (
                        <span><Eye className="h-4 w-4 inline mr-1" />{campaign.openRate}% opened</span>
                      )}
                      {campaign.clickRate !== undefined && (
                        <span><MousePointer className="h-4 w-4 inline mr-1" />{campaign.clickRate}% clicked</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col gap-2">
                    <div className="text-sm font-medium text-gray-900">{campaign.status}</div>
                    <div className="text-sm text-gray-500">
                      {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : 'Not sent'}
                    </div>
                    {campaign.status === 'sent' && (
                      <button
                        onClick={() => setShowAnalytics(campaign.id)}
                        className="text-xs text-laurx-600 hover:text-laurx-700 flex items-center gap-1"
                      >
                        <BarChart3 className="h-3 w-3" />
                        View Analytics
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Email Campaign</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
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
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700">Recipient Type</label>
                  <select
                    className="select mt-1"
                    value={formData.recipientType}
                    onChange={(e) => setFormData({ ...formData, recipientType: e.target.value as any, selectedGroupIds: [], selectedCustomerIds: [] })}
                  >
                    <option value="all">All Customers</option>
                    <option value="active_subscribers">Active Subscribers Only</option>
                    <option value="groups">Customer Groups</option>
                    <option value="specific_customers">Specific Customers</option>
                  </select>
                </div>
              </div>

              {/* Recipient Count Badge */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Estimated Recipients: {getRecipientCount()}
                  </span>
                </div>
              </div>

              {/* Group Selection */}
              {formData.recipientType === 'groups' && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Groups ({formData.selectedGroupIds.length} selected)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {groups.map(group => (
                      <label key={group.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer">
                        <div className="flex items-center flex-1">
                          <input
                            type="checkbox"
                            checked={formData.selectedGroupIds.includes(group.id)}
                            onChange={() => toggleGroup(group.id)}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{group.name}</div>
                            {group.description && (
                              <div className="text-xs text-gray-500">{group.description}</div>
                            )}
                          </div>
                        </div>
                        {group.customerCount !== undefined && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                            {group.customerCount} members
                          </span>
                        )}
                      </label>
                    ))}
                    {groups.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No groups available. Create groups first.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Selection */}
              {formData.recipientType === 'specific_customers' && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Customers ({formData.selectedCustomerIds.length} selected)
                  </label>
                  <div className="mb-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search customers by email or name..."
                        className="input pl-10"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredCustomers.map(customer => (
                      <label key={customer.id} className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.selectedCustomerIds.includes(customer.id)}
                          onChange={() => toggleCustomer(customer.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{customer.email}</div>
                          {customer.name && (
                            <div className="text-xs text-gray-500">{customer.name}</div>
                          )}
                        </div>
                      </label>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No customers found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Email Content Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Email Content</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditorMode('rich')}
                      className={`px-3 py-1 text-xs rounded flex items-center gap-1 ${
                        editorMode === 'rich'
                          ? 'bg-laurx-100 text-laurx-700 border border-laurx-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Type className="h-3 w-3" />
                      Rich Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('html')}
                      className={`px-3 py-1 text-xs rounded flex items-center gap-1 ${
                        editorMode === 'html'
                          ? 'bg-laurx-100 text-laurx-700 border border-laurx-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Code className="h-3 w-3" />
                      HTML
                    </button>
                  </div>
                </div>
                {editorMode === 'rich' ? (
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    modules={quillModules}
                    className="bg-white"
                    style={{ height: '300px', marginBottom: '50px' }}
                  />
                ) : (
                  <textarea
                    required
                    rows={12}
                    className="textarea mt-1 font-mono text-sm"
                    value={formData.htmlContent}
                    onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                    placeholder="Enter HTML content here..."
                  />
                )}
              </div>

              {/* Email Tracking */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableTracking}
                    onChange={(e) => setFormData({ ...formData, enableTracking: e.target.checked })}
                    className="mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Enable Email Tracking</div>
                    <div className="text-xs text-gray-500">Track opens, clicks, and engagement metrics</div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
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

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Campaign Analytics</h3>
              <button onClick={() => setShowAnalytics(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {(() => {
              const campaign = emailCampaigns.find(c => c.id === showAnalytics)
              if (!campaign) return null

              return (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                    <p className="text-sm text-gray-500">{campaign.subject}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Sent</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">{campaign.recipients}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Opened</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">{campaign.openRate || 0}%</div>
                      <div className="text-xs text-green-700">
                        ~{Math.round((campaign.recipients * (campaign.openRate || 0)) / 100)} users
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MousePointer className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Clicked</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">{campaign.clickRate || 0}%</div>
                      <div className="text-xs text-purple-700">
                        ~{Math.round((campaign.recipients * (campaign.clickRate || 0)) / 100)} users
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Engagement Timeline</h5>
                    <div className="text-sm text-gray-500">
                      <p>Sent: {campaign.sentAt ? new Date(campaign.sentAt).toLocaleString() : 'Not sent'}</p>
                      <p className="mt-1 text-xs">Detailed engagement data will be available here once the backend tracking is implemented.</p>
                    </div>
                  </div>
                </div>
              )
            })()}
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
