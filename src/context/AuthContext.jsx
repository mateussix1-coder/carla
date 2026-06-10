import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../utils/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quickTeacherLoginAvailable, setQuickTeacherLoginAvailable] = useState(false)
  const [systemError, setSystemError] = useState('')

  async function refreshSession() {
    setLoading(true)
    try {
      const result = await apiRequest('/api/auth/session')
      setUser(result.user)
      setQuickTeacherLoginAvailable(Boolean(result.quickTeacherLoginAvailable))
      setSystemError('')
      return result.user
    } catch (error) {
      setUser(null)
      setSystemError(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshSession()
  }, [])

  async function login(credentials) {
    const result = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    setUser(result.user)
    setSystemError('')
    return result.user
  }

  async function register(details) {
    const result = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(details),
    })
    if (result.user) setUser(result.user)
    setSystemError('')
    return result
  }

  async function logout() {
    await apiRequest('/api/auth/logout', { method: 'POST' })
    setUser(null)
    await refreshSession()
  }

  async function updateProfile(details) {
    const result = await apiRequest('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(details),
    })
    setUser(result.user)
    setQuickTeacherLoginAvailable(false)
    return result.user
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      quickTeacherLoginAvailable,
      systemError,
      login,
      register,
      logout,
      updateProfile,
      refreshSession,
      apiRequest,
    }),
    [user, loading, quickTeacherLoginAvailable, systemError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
