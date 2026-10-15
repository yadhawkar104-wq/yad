import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return setLoading(false)
    api('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const r = await api('/auth/login', { method: 'POST', body: { email, password } })
    localStorage.setItem('token', r.token)
    setUser(r.user)
    return r.user
  }
  const signup = async (name, email, password) => {
    const r = await api('/auth/register', { method: 'POST', body: { name, email, password } })
    localStorage.setItem('token', r.token)
    setUser(r.user)
    return r.user
  }
  const selectRole = async (role) => {
    const r = await api('/auth/select-role', { method: 'POST', body: { role } })
    localStorage.setItem('token', r.token)
    setUser(r.user)
    return r.user
  }
  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return <AuthCtx.Provider value={{ user, loading, login, signup, selectRole, logout, setUser }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
