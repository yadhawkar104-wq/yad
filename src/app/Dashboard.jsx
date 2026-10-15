import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { useApi } from '../lib/api.js'
import { Loading, Card } from '../components/ui.jsx'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const { data, loading } = useApi('/dashboard')
  if (loading || !data) return <Loading label={t('common.loading')} />

  const dateStr = new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-IQ' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome banner */}
      <div className="hero-bg glow-gold relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-16 -end-10 text-[10rem] opacity-10">🎓</div>
        <p className="text-sm font-semibold text-gold">{dateStr}</p>
        <h1 className="mt-1 text-3xl font-extrabold text-white sm:text-4xl">
          {t('dash.hello')}, {user?.name}! <span className="inline-block">👋</span>
        </h1>
        <p className="mt-2 max-w-lg text-sm text-white/60">{t('landing.heroSub')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.stats.map((s) => (
          <Card key={s.k} className="transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <span className="text-3xl">{s.icon}</span>
              <span className="text-2xl font-extrabold text-navy sm:text-3xl">{s.v}</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500 sm:text-sm">{t('dash.' + s.k)}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's classes */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold text-navy">🗓️ {t('dash.todaySchedule')}</h2>
            <Link to="/app/timetable" className="text-xs font-bold text-gold-700 hover:underline">{t('common.viewAll')}</Link>
          </div>
          {data.timetable?.length ? (
            <ul className="divide-y divide-slate-100">
              {data.timetable.map((e) => (
                <li key={e.id} className="flex items-center gap-4 py-3">
                  <div className="w-20 shrink-0 rounded-xl bg-navy-700 px-2 py-1.5 text-center text-xs font-bold text-gold">{e.start_time}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-navy">{e.subject_name}</p>
                    <p className="text-xs text-slate-500">{e.class_name} • {t('tt.room')} {e.room}</p>
                  </div>
                  <span className="text-xs text-slate-400">{e.start_time}–{e.end_time}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">{t('tt.noClasses')}</p>
          )}
        </Card>

        {/* Upcoming events */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold text-navy">🎉 {t('dash.upcomingEvents')}</h2>
          </div>
          {data.events?.length ? (
            <ul className="space-y-3">
              {data.events.map((e) => (
                <li key={e.id} className="flex items-center gap-3 rounded-xl bg-gold/10 p-3">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gold text-navy">
                    <span className="text-lg font-extrabold leading-none">{new Date(e.date).getDate()}</span>
                    <span className="text-[9px] font-bold uppercase">{new Date(e.date).toLocaleString('en', { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-navy">{e.title}</p>
                    <p className="truncate text-xs text-slate-500">{e.location}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">—</p>
          )}
        </Card>
      </div>

      {/* Announcements */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-extrabold text-navy">📢 {t('dash.latestAnnouncements')}</h2>
          <Link to="/app/announcements" className="text-xs font-bold text-gold-700 hover:underline">{t('common.viewAll')}</Link>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {data.announcements.map((a) => (
            <li key={a.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-sm font-bold text-navy">{a.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.body}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{a.author} • {new Date(a.created_at).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
