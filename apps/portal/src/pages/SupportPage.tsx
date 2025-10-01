const SupportPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-600">Get help with your LAURx account</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Contact Support</h2>
          </div>
          <div className="card-content">
            <p className="text-gray-600 mb-4">
              Need help? Our support team is here to assist you.
            </p>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Email:</span>{' '}
                <a href="mailto:support@mylaurelrose.com" className="text-laurx-600 hover:text-laurx-700">
                  support@mylaurelrose.com
                </a>
              </p>
              <p className="text-sm">
                <span className="font-medium">Hours:</span> Monday - Friday, 9 AM - 5 PM EST
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">How do I modify my subscription?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Visit the Subscriptions page to manage your active subscriptions.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">How do I update my payment method?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Go to Payment Methods to add, update, or remove payment information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupportPage
