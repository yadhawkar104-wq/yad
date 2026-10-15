import { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { Avatar, Badge } from '../components/ui.jsx'
import { LangSwitch, Brand } from '../pages/Landing.jsx'

const NAV = [
  { to: '/app', icon: '🏫', key: 'nav.dashboard', roles: 'all', end: true },
  { to: '/app/students', icon: '👥', key: 'nav.students', roles: ['admin'] },
  { to: '/app/teachers', icon: '👨‍🏫', key: 'nav.teachers', roles: ['admin'] },
  { to: '/app/classes', icon: '🏛️', key: 'nav.classes', roles: ['admin', 'teacher'] },
  { to: '/app/attendance', icon: '✅', key: 'nav.attendance', roles: 'all' },
  { to: '/app/assignments', icon: '📝', key: 'nav.assignments', roles: ['admin', 'teacher', 'student'] },
  { to: '/app/grades', icon: '📊', key: 'nav.grades', roles: 'all' },
  { to: '/app/timetable', icon: '🗓️', key: 'nav.timetable', roles: 'all' },
  { to: '/app/announcements', icon: '📢', key: 'nav.announcements', roles: 'all' },
  { to: '/app/events', icon: '🎉', key: 'nav.events', roles: 'all' },
  { to: '/app/fees', icon: '💳', key: 'nav.fees', roles: ['admin', 'student', 'parent'] },
  { to: '/app/library', icon: '📚', key: 'nav.library', roles: 'all' },
  { to: '/app/messages', icon: '✉️', key: 'nav.messages', roles: 'all' },
  { to: '/app/profile', icon: '⚙️', key: 'nav.profile', roles: 'all' }
]

export default function Layout() {
  const { t } = useI18n()
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const items = NAV.filter((n) => n.roles === 'all' || n.roles.includes(user?.role))

  const doLogout = () => { logout(); nav('/') }

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      {/* Sidebar */}
      <aside className={`hero-bg fixed inset-y-0 z-40 flex w-72 flex-col transition-transform lg:static lg:w-64 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full lg:rtl:translate-x-0'}`}>
        <div className="px-5 py-5"><Brand light /></div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
              }>
              <span className="text-lg">{n.icon}</span>{t(n.key)}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar user={user} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{user?.name}</p>
              <p className="text-xs font-semibold text-gold">{t('role.' + user?.role)}</p>
            </div>
            <button onClick={doLogout} title={t('common.logout')} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white">⏻</button>
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-navy/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-5 py-3 backdrop-blur">
          <button className="rounded-lg p-2 text-navy hover:bg-slate-100 lg:hidden" onClick={() => setOpen(!open)}>☰</button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-navy-600">{t('appName')}</span>
            <Badge value={user?.role} />
          </div>
          <div className="flex items-center gap-3">
            <LangSwitch />
            <Link to="/app/profile" className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-slate-100">
              <Avatar user={user} />
              <span className="hidden max-w-[10rem] truncate text-sm font-semibold sm:block">{user?.name}</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
