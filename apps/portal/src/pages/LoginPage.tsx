import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { Mail, Shield, ArrowRight } from 'lucide-react'

const LoginPage = () => {
  const { isAuthenticated, requestCode, login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    try {
      await requestCode(email)
      setStep('code')
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code) return

    setIsSubmitting(true)
    try {
      await login(email, code)
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setCode('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-laurx-50 to-laurx-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-laurx-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LAURx Portal</h1>
          <p className="text-gray-600">Secure access to your account</p>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'email' ? 'Sign In' : 'Enter Verification Code'}
            </h2>
            <p className="text-sm text-gray-600">
              {step === 'email' 
                ? 'Enter your email to receive a secure verification code'
                : `We've sent a 6-digit code to ${email}`
              }
            </p>
          </div>

          <div className="card-content">
            {step === 'email' ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="Enter your email address"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!email || isSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Code expires in 10 minutes
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={code.length !== 6 || isSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      Verify & Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="btn-ghost w-full"
                  disabled={isSubmitting}
                >
                  Use Different Email
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Need help? Contact us at{' '}
            <a href="mailto:support@mylaurelrose.com" className="text-laurx-600 hover:text-laurx-700">
              support@mylaurelrose.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
