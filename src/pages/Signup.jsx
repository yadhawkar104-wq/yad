import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { Btn, Input } from '../components/ui.jsx'
import { toast } from '../main.jsx'
import { AuthShell, SocialButtons } from './Login.jsx'

export default function Signup() {
  const { t } = useI18n()
  const { signup } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (password.length < 6) return toast(t('auth.passwordHint'), 'err')
    setBusy(true)
    try {
      await signup(name, email, password)
      nav('/select-role', { replace: true })
    } catch (err) {
      toast(err.message, 'err')
      setBusy(false)
    }
  }

  return (
    <AuthShell title={t('auth.signupTitle')} subtitle={t('auth.signupSub')}>
      <SocialButtons />
      <div className="my-5 flex items-center gap-3 text-xs font-semibold text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> {t('auth.orContinue')} <span className="h-px flex-1 bg-slate-200" />
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Input label={t('common.name')} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ali Ahmed" />
        <Input label={t('common.email')} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Input label={t('common.password')} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <p className="text-xs text-slate-400">{t('auth.passwordHint')}</p>
        <Btn className="w-full py-3" disabled={busy}>{busy ? t('common.loading') : t('common.signup')}</Btn>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        {t('auth.hasAccount')} <Link to="/login" className="font-bold text-navy hover:underline">{t('common.login')}</Link>
      </p>
    </AuthShell>
  )
}
