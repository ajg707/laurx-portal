import { useEffect, useState } from 'react'
import { useAdmin } from '../contexts/AdminContext'
import { Tag, Plus, Percent, DollarSign, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const CouponsPage = () => {
  const { coupons, fetchCoupons, createCoupon, loading } = useAdmin()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent' as 'percent' | 'amount',
    value: 0,
    description: '',
    expiresAt: '',
    maxUses: undefined as number | undefined
  })

  useEffect(() => {
    fetchCoupons()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCoupon(formData)
      toast.success('Coupon created successfully!')
      setShowCreateForm(false)
      setFormData({
        code: '',
        type: 'percent',
        value: 0,
        description: '',
        expiresAt: '',
        maxUses: undefined
      })
      fetchCoupons()
    } catch (error) {
      toast.error('Failed to create coupon')
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'badge-success' : 'badge-neutral'
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
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage discount codes for your customers
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Coupon
        </button>
      </div>

      {/* Coupon Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {coupons.length}
                </div>
                <div className="text-sm text-gray-500">Total Coupons</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {coupons.filter(c => c.isActive).length}
                </div>
                <div className="text-sm text-gray-500">Active Coupons</div>
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
                  {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Uses</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Coupon Codes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 font-mono">
                        {coupon.code}
                      </div>
                      <div className="text-sm text-gray-500">
                        {coupon.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {coupon.type === 'percent' ? (
                        <Percent className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {coupon.value}{coupon.type === 'percent' ? '%' : ''} off
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {coupon.usedCount}
                    {coupon.maxUses && ` / ${coupon.maxUses}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coupon.expiresAt ? (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(coupon.expiresAt).toLocaleDateString()}
                      </div>
                    ) : (
                      'Never'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusColor(coupon.isActive)}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Coupon</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Coupon Code</label>
                <input
                  type="text"
                  required
                  className="input mt-1 font-mono"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Discount Type</label>
                <select
                  className="select mt-1"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="percent">Percentage</option>
                  <option value="amount">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Discount Value {formData.type === 'percent' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={formData.type === 'percent' ? 100 : undefined}
                  className="input mt-1"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  required
                  className="input mt-1"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="20% off your next order"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiration Date (Optional)</label>
                <input
                  type="date"
                  className="input mt-1"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Uses (Optional)</label>
                <input
                  type="number"
                  min="1"
                  className="input mt-1"
                  value={formData.maxUses || ''}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Leave empty for unlimited"
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
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {coupons.length === 0 && (
        <div className="text-center py-12">
          <Tag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No coupons yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first coupon to offer discounts to customers.
          </p>
        </div>
      )}
    </div>
  )
}

export default CouponsPage
