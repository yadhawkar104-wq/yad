import { Link } from 'react-router-dom'
import { useI18n, LANGS } from '../lib/i18n.jsx'
import { Btn } from '../components/ui.jsx'

export const HERO_IMG = 'https://media.base44.com/images/public/6acf78be553cd6273916137e/8c4484bfe_generated_7f3965f8.png'

export function LangSwitch({ dark = false }) {
  const { lang, setLang } = useI18n()
  return (
    <div className={`flex items-center gap-1 rounded-full p-1 ${dark ? 'bg-white/10' : 'bg-navy-700/5'}`}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`rounded-full px-3 py-1 text-xs font-bold transition ${lang === l.code ? 'bg-gold text-navy' : dark ? 'text-white/70 hover:text-white' : 'text-navy-600 hover:text-navy'}`}
        >
          {l.code === 'ar' ? 'عربي' : l.short}
        </button>
      ))}
    </div>
  )
}

export function Brand({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-xl shadow-lg shadow-gold/30">🎓</span>
      <span className="leading-tight">
        <span className={`block font-extrabold tracking-wide ${light ? 'text-white' : 'text-navy'}`}>TISHKGASHA</span>
        <span className={`block text-[10px] font-semibold tracking-widest uppercase ${light ? 'text-gold' : 'text-gold-700'}`}>Private School</span>
      </span>
    </Link>
  )
}

const FEATURES = [
  ['👥', 'feat.1t', 'feat.1d'], ['✅', 'feat.2t', 'feat.2d'], ['📊', 'feat.3t', 'feat.3d'],
  ['📝', 'feat.4t', 'feat.4d'], ['🗓️', 'feat.5t', 'feat.5d'], ['💳', 'feat.6t', 'feat.6d'],
  ['📚', 'feat.7t', 'feat.7d'], ['📢', 'feat.8t', 'feat.8d'], ['✉️', 'feat.9t', 'feat.9d']
]

const ROLES = [
  ['👑', 'role.admin', 'auth.roleAdminDesc'],
  ['👨‍🏫', 'role.teacher', 'auth.roleTeacherDesc'],
  ['🎓', 'role.student', 'auth.roleStudentDesc'],
  ['👨‍👩‍👧', 'role.parent', 'auth.roleParentDesc']
]

export default function Landing() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Nav */}
      <header className="hero-bg sticky top-0 z-40 border-b border-white/10 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <Brand light />
          <div className="flex items-center gap-3">
            <LangSwitch dark />
            <Link to="/login"><Btn variant="outlineGold" size="sm">{t('common.login')}</Btn></Link>
            <Link to="/signup"><Btn size="sm">{t('landing.ctaStart')}</Btn></Link>
          </div>
        </div>
      </header>

      {/* Hero — 3D graduation stage welcome sign */}
      <section className="hero-bg relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -start-24 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -end-24 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-in">
            <p className="mb-3 inline-block rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-sm font-bold text-gold">
              ⭐ {t('landing.welcomeTo')} {t('appName')}
            </p>
            <h1 className="font-kufi text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              {t('landing.heroTitle')}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">{t('landing.heroSub')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup"><Btn className="px-7 py-3.5 text-base">{t('landing.ctaStart')} →</Btn></Link>
              <Link to="/login"><Btn variant="outlineGold" className="px-7 py-3.5 text-base">{t('landing.ctaLogin')}</Btn></Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {[['1200+', 'landing.statStudents'], ['80+', 'landing.statTeachers'], ['15+', 'landing.statYears']].map(([v, k]) => (
                <div key={k} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <div className="text-2xl font-extrabold text-gold">{v}</div>
                  <div className="mt-0.5 text-xs font-medium text-white/60">{t(k)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3D hero artwork */}
          <div className="relative mx-auto w-full max-w-lg animate-fade-in">
            <div className="glow-gold animate-float rounded-[2.5rem] border-4 border-gold/40 bg-[#0b162c] shadow-2xl">
              <img src={HERO_IMG} alt="TishkGasha 3D graduation stage" className="w-full rounded-[2.2rem]" />
            </div>
            <span className="absolute -top-4 -start-4 animate-float-slow rounded-2xl bg-gold px-4 py-2 text-sm font-extrabold text-navy shadow-xl">
              🏆 {t('landing.badge1')}
            </span>
            <span className="absolute -bottom-4 -start-6 animate-float rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-navy shadow-xl" style={{ animationDelay: '1.2s' }}>
              📚 {t('landing.badge2')}
            </span>
            <span className="absolute -bottom-4 -end-4 animate-float-slow rounded-2xl bg-gold px-4 py-2 text-sm font-extrabold text-navy shadow-xl" style={{ animationDelay: '2s' }}>
              🎓 {t('landing.badge3')}
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <h2 className="text-center text-3xl font-extrabold text-navy sm:text-4xl">{t('landing.featuresTitle')}</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">{t('landing.featuresSub')}</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([icon, tk, dk]) => (
            <div key={tk} className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition hover:-translate-y-1 hover:shadow-xl hover:ring-gold">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-2xl transition group-hover:bg-gold">{icon}</div>
              <h3 className="text-lg font-bold text-navy">{t(tk)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{t(dk)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="hero-bg py-20">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="text-center text-3xl font-extrabold text-white sm:text-4xl">{t('landing.rolesTitle')}</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map(([icon, rk, dk]) => (
              <div key={rk} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur transition hover:border-gold/50 hover:bg-white/10">
                <div className="text-4xl">{icon}</div>
                <h3 className="mt-3 font-bold text-gold">{t(rk)}</h3>
                <p className="mt-1.5 text-sm text-white/60">{t(dk)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + footer */}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <h2 className="text-3xl font-extrabold text-navy">{t('landing.heroTitle')}</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-500">{t('landing.heroSub')}</p>
        <Link to="/signup" className="mt-8 inline-block"><Btn className="px-10 py-4 text-base">{t('landing.ctaStart')} →</Btn></Link>
      </section>
      <footer className="hero-bg py-8 text-center text-sm text-white/50">{t('landing.footer')}</footer>
    </div>
  )
}
