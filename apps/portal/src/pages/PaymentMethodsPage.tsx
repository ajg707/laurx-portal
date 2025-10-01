const PaymentMethodsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600">Manage your payment information</p>
        </div>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <p className="text-gray-500">Payment method management coming soon...</p>
            <p className="text-sm text-gray-400 mt-2">
              You'll be able to add, update, and remove payment methods here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentMethodsPage
