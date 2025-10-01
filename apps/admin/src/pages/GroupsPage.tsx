import { useEffect, useState } from 'react'
import { Users, Plus, Trash2, X } from 'lucide-react'

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

const GroupsPage = () => {
  const [groups, setGroups] = useState<CustomerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [groupType, setGroupType] = useState<'static' | 'dynamic'>('static')
  const [saving, setSaving] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  useEffect(() => {
    fetchGroups()
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

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          type: groupType,
          customerIds: groupType === 'static' ? [] : undefined,
          criteria: groupType === 'dynamic' ? {} : undefined
        })
      })

      if (response.ok) {
        setShowCreateModal(false)
        setGroupName('')
        setGroupDescription('')
        setGroupType('static')
        await fetchGroups()
      } else {
        const error = await response.json()
        alert(`Failed to create group: ${error.message}`)
      }
    } catch (error) {
      alert('Failed to create group')
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
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          group.type === 'static'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {group.type === 'static' ? 'Static List' : 'Dynamic Criteria'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Create Customer Group</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
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
                      Manually add/remove customers
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
                {groupType === 'dynamic' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Criteria editing coming soon. For now, create the group and configure criteria via API.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowCreateModal(false)}
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
    </div>
  )
}

export default GroupsPage
