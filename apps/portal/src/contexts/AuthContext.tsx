import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import toast from 'react-hot-toast'

interface User {
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, code: string) => Promise<void>
  requestCode: (email: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('laurx_token')
    const storedUser = localStorage.getItem('laurx_user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      
      // Verify token is still valid
      verifyToken(storedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setToken(tokenToVerify)
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('laurx_token')
        localStorage.removeItem('laurx_user')
        setToken(null)
        setUser(null)
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('laurx_token')
      localStorage.removeItem('laurx_user')
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const requestCode = async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/request-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      toast.success('Verification code sent to your email!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send verification code'
      toast.error(message)
      throw error
    }
  }

  const login = async (email: string, code: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      // Store token and user data
      localStorage.setItem('laurx_token', data.token)
      localStorage.setItem('laurx_user', JSON.stringify(data.user))
      
      setToken(data.token)
      setUser(data.user)
      
      toast.success('Welcome to your LAURx portal!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed'
      toast.error(message)
      throw error
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      // Clear local storage and state regardless of API call success
      localStorage.removeItem('laurx_token')
      localStorage.removeItem('laurx_user')
      setToken(null)
      setUser(null)
      toast.success('Logged out successfully')
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    requestCode,
    logout,
    isAuthenticated: !!user && !!token,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
