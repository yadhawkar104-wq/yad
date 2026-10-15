import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { socialUrl } from '../lib/api.js'
import { Btn, Input } from '../components/ui.jsx'
import { toast } from '../main.jsx'
import { Brand, LangSwitch, HERO_IMG } from './Landing.jsx'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
)
const MicrosoftIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <rect x="1" y="1" width="10.5" height="10.5" fill="#F35325"/><rect x="12.5" y="1" width="10.5" height="10.5" fill="#81BC06"/>
    <rect x="1" y="12.5" width="10.5" height="10.5" fill="#05A6F0"/><rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFBA08"/>
  </svg>
)
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.13 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97H15.83c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.13 24 18.1 24 12.07z"/></svg>
)

export function SocialButtons() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const provider = params.get('social_error')
  const providerName = { google: 'Google', microsoft: 'Microsoft', facebook: 'Facebook', no_email: 'social' }[provider]
  if (providerName) toast(t('auth.notConfigured'), 'err')
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <Btn variant="ghost" onClick={() => (window.location.href = socialUrl('google'))}><GoogleIcon /> Google</Btn>
        <Btn variant="ghost" onClick={() => (window.location.href = socialUrl('microsoft'))}><MicrosoftIcon /> Microsoft</Btn>
        <Btn variant="ghost" onClick={() => (window.location.href = socialUrl('facebook'))}><FacebookIcon /> Facebook</Btn>
      </div>
      {provider && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          {t('auth.notConfigured')}
        </p>
      )}
    </div>
  )
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="hero-bg flex min-h-screen flex-col">
      <div className="flex items-center justify-between px-5 py-4">
        <Brand light />
        <LangSwitch dark />
      </div>
      <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-5 py-8 lg:grid-cols-2">
        <div className="hidden lg:block">
          <div className="glow-gold animate-float rounded-[2.5rem] border-4 border-gold/40 bg-[#0b162c] shadow-2xl">
            <img src={HERO_IMG} alt="TishkGasha" className="w-full rounded-[2.2rem]" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
          <h1 className="text-2xl font-extrabold text-navy">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const { t } = useI18n()
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const u = await login(email, password)
      nav(u.role ? '/app' : '/select-role', { replace: true })
    } catch (err) {
      toast(err.message, 'err')
      setBusy(false)
    }
  }

  const demos = [
    ['admin@tishk.edu', '👑 ' + t('role.admin')],
    ['teacher@tishk.edu', '👨‍🏫 ' + t('role.teacher')],
    ['student@tishk.edu', '🎓 ' + t('role.student')],
    ['parent@tishk.edu', '👨‍👩‍👧 ' + t('role.parent')]
  ]

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSub')}>
      <SocialButtons />
      <div className="my-5 flex items-center gap-3 text-xs font-semibold text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> {t('auth.orContinue')} <span className="h-px flex-1 bg-slate-200" />
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Input label={t('common.email')} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Input label={t('common.password')} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <Btn className="w-full py-3" disabled={busy}>{busy ? t('common.loading') : t('common.login')}</Btn>
      </form>
      <div className="mt-5 rounded-2xl bg-gold/10 p-4">
        <p className="text-xs font-bold text-gold-700">✨ {t('auth.demoTitle')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {demos.map(([em, label]) => (
            <button key={em} type="button" onClick={() => { setEmail(em); setPassword('Demo@2026') }}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 ring-1 ring-gold/60 transition hover:bg-gold">
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-5 text-center text-sm text-slate-500">
        {t('auth.noAccount')} <Link to="/signup" className="font-bold text-navy hover:underline">{t('common.signup')}</Link>
      </p>
    </AuthShell>
  )
}
