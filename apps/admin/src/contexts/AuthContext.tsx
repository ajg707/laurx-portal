import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  adminUser: AdminUser | null
  login: (email: string, code: string) => Promise<void>
  logout: () => void
  requestCode: (email: string) => Promise<void>
}

interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'super_admin'
  permissions: string[]
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token')
    const storedUser = localStorage.getItem('admin_user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setAdminUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
  }, [])

  const requestCode = async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/auth/request-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send verification code')
    }
  }

  const login = async (email: string, code: string) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/auth/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Invalid verification code')
    }

    const data = await response.json()
    
    setToken(data.token)
    setAdminUser(data.user)
    setIsAuthenticated(true)
    
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_user', JSON.stringify(data.user))
  }

  const logout = () => {
    setToken(null)
    setAdminUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  const value = {
    isAuthenticated,
    token,
    adminUser,
    login,
    logout,
    requestCode,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
