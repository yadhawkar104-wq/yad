import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { Loading } from '../components/ui.jsx'

export default function AuthCallback() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  useEffect(() => {
    const token = params.get('token')
    if (!token) return nav('/login', { replace: true })
    localStorage.setItem('token', token)
    api('/auth/me')
      .then((r) => nav(r.user.role ? '/app' : '/select-role', { replace: true }))
      .catch(() => {
        localStorage.removeItem('token')
        nav('/login', { replace: true })
      })
  }, []) // eslint-disable-line
  return <div className="flex min-h-screen items-center justify-center"><Loading /></div>
}
