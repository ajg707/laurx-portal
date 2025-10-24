import { useEffect, useState } from 'react'
import { Users, Plus, Trash2, X, Search, Edit } from 'lucide-react'

interface CustomerGroup {
  id: string
  name: string
  description: string
  type: 'static' | 'dynamic'
  customerIds?: string[]
  criteria?: GroupCriteria
  createdAt: string
  updatedAt: string
  createdBy: string
}

interface GroupCriteria {
  minTotalSpent?: number
  maxTotalSpent?: number
  status?: ('active' | 'inactive' | 'churned')[]
  createdAfter?: string
  createdBefore?: string
  lastOrderAfter?: string
  lastOrderBefore?: string
  hasActiveSubscription?: boolean
  hasAnySubscription?: boolean
  minOrders?: number
  maxOrders?: number
}

interface Customer {
  id: string
  email: string
  name: string
}

const GroupsPage = () => {
  const [groups, setGroups] = useState<CustomerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [groupType, setGroupType] = useState<'static' | 'dynamic'>('static')
  const [saving, setSaving] = useState(false)

  // Static group state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])
  const [customerSearch, setCustomerSearch] = useState('')

  // Dynamic group state
  const [criteria, setCriteria] = useState<GroupCriteria>({})

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  useEffect(() => {
    fetchGroups()
    fetchCustomers()
  }, [])

  const fetchGroups = async () => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
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

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name')
      return
    }

    if (groupType === 'static' && selectedCustomerIds.length === 0) {
      alert('Please select at least one customer for static group')
      return
    }

    if (groupType === 'dynamic' && Object.keys(criteria).length === 0) {
      alert('Please set at least one criteria for dynamic group')
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        name: groupName,
        description: groupDescription,
        type: groupType
      }

      if (groupType === 'static') {
        payload.customerIds = selectedCustomerIds
      } else {
        payload.criteria = criteria
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowCreateModal(false)
        setGroupName('')
        setGroupDescription('')
        setGroupType('static')
        setSelectedCustomerIds([])
        setCriteria({})
        await fetchGroups()
      } else {
        const error = await response.json()
        alert(`Failed to create group: ${error.message || error.error}`)
      }
    } catch (error) {
      alert('Failed to create group')
    } finally {
      setSaving(false)
    }
  }

  const handleEditGroup = (group: CustomerGroup) => {
    setEditingGroup(group)
    setGroupName(group.name)
    setGroupDescription(group.description)
    setGroupType(group.type)
    if (group.type === 'static' && group.customerIds) {
      setSelectedCustomerIds(group.customerIds)
    } else if (group.type === 'dynamic' && group.criteria) {
      setCriteria(group.criteria)
    }
    setShowEditModal(true)
  }

  const handleUpdateGroup = async () => {
    if (!groupName.trim() || !editingGroup) {
      alert('Please enter a group name')
      return
    }

    if (groupType === 'static' && selectedCustomerIds.length === 0) {
      alert('Please select at least one customer for static group')
      return
    }

    if (groupType === 'dynamic' && Object.keys(criteria).length === 0) {
      alert('Please set at least one criteria for dynamic group')
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        name: groupName,
        description: groupDescription,
        type: groupType
      }

      if (groupType === 'static') {
        payload.customerIds = selectedCustomerIds
      } else {
        payload.criteria = criteria
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowEditModal(false)
        setEditingGroup(null)
        setGroupName('')
        setGroupDescription('')
        setGroupType('static')
        setSelectedCustomerIds([])
        setCriteria({})
        await fetchGroups()
      } else {
        const error = await response.json()
        alert(`Failed to update group: ${error.message || error.error}`)
      }
    } catch (error) {
      alert('Failed to update group')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })

      if (response.ok) {
        await fetchGroups()
      } else {
        alert('Failed to delete group')
      }
    } catch (error) {
      alert('Failed to delete group')
    }
  }

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomerIds(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const filteredCustomers = customers.filter(c =>
    c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.name?.toLowerCase().includes(customerSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Groups</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize customers into static or dynamic groups for targeted campaigns
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Group
        </button>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="card">
          <div className="card-content">
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Groups Yet</h3>
              <p className="text-sm text-gray-500 mt-2">
                Create your first customer group to start organizing your customer base.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-6 btn-primary flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Create Your First Group
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group.id} className="card">
              <div className="card-content">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{group.description || 'No description'}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          group.type === 'static'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {group.type === 'static' ? 'Static List' : 'Dynamic Criteria'}
                        </span>
                        {group.type === 'static' && group.customerIds && (
                          <span className="text-xs text-gray-600">
                            {group.customerIds.length} customers
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit group"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-lg z-10">
              <h2 className="text-xl font-bold text-gray-900">Create Customer Group</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setGroupName('')
                  setGroupDescription('')
                  setGroupType('static')
                  setSelectedCustomerIds([])
                  setCriteria({})
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="input w-full"
                  placeholder="e.g. High Value Customers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="input w-full"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGroupType('static')}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      groupType === 'static'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900">Static List</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Manually select customers
                    </p>
                  </button>
                  <button
                    onClick={() => setGroupType('dynamic')}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      groupType === 'dynamic'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900">Dynamic</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Auto-update based on criteria
                    </p>
                  </button>
                </div>
              </div>

              {/* Static Group: Customer Selection */}
              {groupType === 'static' && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Customers <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="input w-full pl-10"
                      placeholder="Search customers..."
                    />
                  </div>
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No customers found</div>
                    ) : (
                      filteredCustomers.map(customer => (
                        <label
                          key={customer.id}
                          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCustomerIds.includes(customer.id)}
                            onChange={() => toggleCustomerSelection(customer.id)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{customer.name || customer.email}</p>
                            {customer.name && <p className="text-xs text-gray-500">{customer.email}</p>}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedCustomerIds.length} customer(s) selected
                  </p>
                </div>
              )}

              {/* Dynamic Group: Criteria Builder */}
              {groupType === 'dynamic' && (
                <div className="border-t pt-4 space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Group Criteria <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Min Total Spent ($)</label>
                      <input
                        type="number"
                        value={criteria.minTotalSpent || ''}
                        onChange={(e) => setCriteria({ ...criteria, minTotalSpent: e.target.value ? Number(e.target.value) : undefined })}
                        className="input w-full"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Max Total Spent ($)</label>
                      <input
                        type="number"
                        value={criteria.maxTotalSpent || ''}
                        onChange={(e) => setCriteria({ ...criteria, maxTotalSpent: e.target.value ? Number(e.target.value) : undefined })}
                        className="input w-full"
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Min Orders</label>
                      <input
                        type="number"
                        value={criteria.minOrders || ''}
                        onChange={(e) => setCriteria({ ...criteria, minOrders: e.target.value ? Number(e.target.value) : undefined })}
                        className="input w-full"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Max Orders</label>
                      <input
                        type="number"
                        value={criteria.maxOrders || ''}
                        onChange={(e) => setCriteria({ ...criteria, maxOrders: e.target.value ? Number(e.target.value) : undefined })}
                        className="input w-full"
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={criteria.hasActiveSubscription || false}
                        onChange={(e) => setCriteria({ ...criteria, hasActiveSubscription: e.target.checked || undefined })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Has Active Subscription</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Last Order After</label>
                    <input
                      type="date"
                      value={criteria.lastOrderAfter || ''}
                      onChange={(e) => setCriteria({ ...criteria, lastOrderAfter: e.target.value || undefined })}
                      className="input w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white rounded-b-lg">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setGroupName('')
                  setGroupDescription('')
                  setGroupType('static')
                  setSelectedCustomerIds([])
                  setCriteria({})
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={saving || !groupName.trim()}
                className="btn-primary"
              >
                {saving ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-lg z-10">
              <h2 className="text-xl font-bold text-gray-900">Edit Customer Group</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingGroup(null)
                  setGroupName('')
                  setGroupDescription('')
                  setGroupType('static')
                  setSelectedCustomerIds([])
                  setCriteria({})
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="input w-full"
                  placeholder="e.g. High Value Customers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="textarea w-full"
                  rows={3}
                  placeholder="Describe this customer group..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Type
                </label>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
                  {groupType === 'static' ? '📋 Static List' : '🔄 Dynamic Criteria'} - Type cannot be changed after creation
                </div>
              </div>

              {groupType === 'static' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Customers ({selectedCustomerIds.length} selected)
                  </label>
                  <div className="mb-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="input pl-10 w-full"
                        placeholder="Search by email or name..."
                      />
                    </div>
                  </div>
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <label
                        key={customer.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCustomerIds.includes(customer.id)}
                          onChange={() => toggleCustomerSelection(customer.id)}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{customer.email}</div>
                          {customer.name && (
                            <div className="text-xs text-gray-500">{customer.name}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingGroup(null)
                  setGroupName('')
                  setGroupDescription('')
                  setGroupType('static')
                  setSelectedCustomerIds([])
                  setCriteria({})
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGroup}
                disabled={saving || !groupName.trim()}
                className="btn-primary"
              >
                {saving ? 'Updating...' : 'Update Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupsPage
