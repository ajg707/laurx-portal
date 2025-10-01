import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { StripeProvider } from './contexts/StripeContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import PaymentMethodsPage from './pages/PaymentMethodsPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import SupportPage from './pages/SupportPage'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

function App() {
  return (
    <AuthProvider>
      <StripeProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Navigate to="/dashboard" replace />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/subscriptions" element={
            <ProtectedRoute>
              <Layout>
                <SubscriptionsPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/payment-methods" element={
            <ProtectedRoute>
              <Layout>
                <PaymentMethodsPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <Layout>
                <OrderHistoryPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/support" element={
            <ProtectedRoute>
              <Layout>
                <SupportPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </StripeProvider>
    </AuthProvider>
  )
}

export default App
