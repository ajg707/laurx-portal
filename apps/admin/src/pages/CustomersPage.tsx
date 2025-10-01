import { useEffect, useState } from 'react'
import { useAdmin, CustomerDetails } from '../contexts/AdminContext'
import { Search, Mail, DollarSign, Calendar, X, ExternalLink } from 'lucide-react'

const CustomersPage = () => {
  const { customers, fetchCustomers, fetchCustomerDetails, coupons, fetchCoupons, applyCouponToCustomer, loading } = useAdmin()
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'day' | 'week' | 'month' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [couponModalCustomerId, setCouponModalCustomerId] = useState<string | null>(null)
  const [selectedCouponId, setSelectedCouponId] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCustomers()
    fetchCoupons()
  }, [])

  const getDateRangeFilter = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (dateFilter) {
      case 'day':
        return { start: today, end: now }
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return { start: weekAgo, end: now }
      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setDate(monthAgo.getDate() - 30)
        return { start: monthAgo, end: now }
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: new Date(customStartDate),
            end: new Date(customEndDate + 'T23:59:59')
          }
        }
        return null
      default:
        return null
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = (customer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (customer.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())

    // Date range filter
    if (dateFilter !== 'all') {
      const range = getDateRangeFilter()
      if (range && customer.lastOrderDate) {
        const lastOrder = new Date(customer.lastOrderDate)
        if (lastOrder < range.start || lastOrder > range.end) {
          return false
        }
      } else if (range && !customer.lastOrderDate) {
        return false // Exclude customers with no orders when filtering by date
      }
    }

    return matchesSearch
  })

  // Sort by last payment date (most recent first)
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (!a.lastOrderDate && !b.lastOrderDate) return 0
    if (!a.lastOrderDate) return 1 // Customers with no orders go to bottom
    if (!b.lastOrderDate) return -1
    return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
  })

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'badge-success',
      inactive: 'badge-warning',
      churned: 'badge-danger'
    }
    return badges[status as keyof typeof badges] || 'badge-neutral'
  }

  const handleViewDetails = async (customerId: string) => {
    setDetailsLoading(true)
    try {
      const details = await fetchCustomerDetails(customerId)
      setSelectedCustomer(details)
    } catch (error) {
      console.error('Failed to fetch customer details:', error)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponModalCustomerId || !selectedCouponId) return

    setApplyingCoupon(true)
    try {
      await applyCouponToCustomer(couponModalCustomerId, selectedCouponId)
      alert('Coupon applied and customer notified!')
      setCouponModalCustomerId(null)
      setSelectedCouponId('')
      // Refresh customer list to show updated data
      await fetchCustomers()
    } catch (error) {
      alert('Failed to apply coupon: ' + (error as Error).message)
    } finally {
      setApplyingCoupon(false)
    }
  }

  const toggleCustomerSelection = (customerId: string) => {
    const newSelection = new Set(selectedCustomerIds)
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId)
    } else {
      newSelection.add(customerId)
    }
    setSelectedCustomerIds(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedCustomerIds.size === sortedCustomers.length) {
      setSelectedCustomerIds(new Set())
    } else {
      setSelectedCustomerIds(new Set(sortedCustomers.map(c => c.id)))
    }
  }

  const handleBulkAction = (action: string) => {
    const selectedEmails = customers
      .filter(c => selectedCustomerIds.has(c.id))
      .map(c => c.email)
      .join(', ')

    alert(`${action} action for ${selectedCustomerIds.size} customers:\n${selectedEmails}`)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your customer base and subscription details
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search customers..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <select
            className="select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
          >
            <option value="all">All Time</option>
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Custom Date Range */}
      {dateFilter === 'custom' && (
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="input"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="input"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subscribers</p>
                <p className="text-2xl font-bold text-green-600">
                  {customers.filter(c => c.status === 'active').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold text-purple-600">
                  {sortedCustomers.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Customer List</h3>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedCustomerIds.size > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-900">
                {selectedCustomerIds.size} customer{selectedCustomerIds.size > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedCustomerIds(new Set())}
                className="ml-4 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('Send Email')}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Mail className="h-4 w-4 inline mr-1" />
                Send Email
              </button>
              <button
                onClick={() => handleBulkAction('Export')}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Export
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCustomerIds.size === sortedCustomers.length && sortedCustomers.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscriptions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCustomerIds.has(customer.id)}
                      onChange={() => toggleCustomerSelection(customer.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusBadge(customer.status)}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.subscriptions.length} active
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${customer.totalSpent.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.lastOrderDate
                      ? new Date(customer.lastOrderDate).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(customer.id)}
                      className="text-laurx-600 hover:text-laurx-900 mr-4"
                      disabled={detailsLoading}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => setCouponModalCustomerId(customer.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Apply Coupon
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Mail className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || dateFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Your customers will appear here once they sign up.'
            }
          </p>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.customer.name}</h2>
                <p className="text-sm text-gray-500">{selectedCustomer.customer.email}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">${selectedCustomer.totalSpent.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedCustomer.orderCount}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedCustomer.subscriptions.length}</p>
                </div>
              </div>

              {/* Subscriptions */}
              {selectedCustomer.subscriptions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Active Subscriptions</h3>
                  <div className="space-y-3">
                    {selectedCustomer.subscriptions.map(sub => (
                      <div key={sub.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{sub.plan}</p>
                            <p className="text-sm text-gray-600">
                              ${sub.amount.toFixed(2)}/{sub.interval}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Status: <span className={`font-medium ${sub.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>{sub.status}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Next billing</p>
                            <p className="text-sm font-medium">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</p>
                            {sub.cancelAtPeriodEnd && (
                              <p className="text-xs text-red-600 mt-1">Cancels at period end</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order History */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Order History</h3>
                <div className="space-y-2">
                  {selectedCustomer.orderHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm">No orders yet</p>
                  ) : (
                    selectedCustomer.orderHistory.map(order => (
                      <div key={order.id} className="flex justify-between items-center border-b py-3">
                        <div>
                          <p className="font-medium">{order.description}</p>
                          <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-400 capitalize">{order.type} • {order.status}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <p className="font-medium">${order.amount.toFixed(2)}</p>
                          {order.receiptUrl && (
                            <a
                              href={order.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-laurx-600 hover:text-laurx-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Coupon Modal */}
      {couponModalCustomerId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Apply Coupon</h2>
              <button
                onClick={() => {
                  setCouponModalCustomerId(null)
                  setSelectedCouponId('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Select a coupon to apply to this customer's subscription. They will receive an email notification.
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Coupon
              </label>
              <select
                className="select w-full"
                value={selectedCouponId}
                onChange={(e) => setSelectedCouponId(e.target.value)}
              >
                <option value="">Choose a coupon...</option>
                {coupons.filter(c => c.isActive).map(coupon => (
                  <option key={coupon.id} value={coupon.id}>
                    {coupon.code} - {coupon.type === 'percent' ? `${coupon.value}% off` : `$${coupon.value} off`}
                    {coupon.description && ` (${coupon.description})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t p-4 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => {
                  setCouponModalCustomerId(null)
                  setSelectedCouponId('')
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCoupon}
                disabled={!selectedCouponId || applyingCoupon}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applyingCoupon ? 'Applying...' : 'Apply & Notify Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomersPage
