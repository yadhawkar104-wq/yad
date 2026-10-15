import { useEffect, useState } from 'react'

export function Btn({ children, variant = 'gold', size = 'md', className = '', ...props }) {
  const variants = {
    gold: 'bg-gold text-navy hover:bg-gold-600',
    navy: 'bg-navy-700 text-white hover:bg-navy-600',
    ghost: 'border border-navy-700/20 text-navy-700 hover:bg-navy-700/5',
    soft: 'bg-navy-700/10 text-navy hover:bg-navy-700/20',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outlineGold: 'border-2 border-gold text-gold hover:bg-gold hover:text-navy'
  }
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm' }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>}
      <input
        className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30 ${className}`}
        {...props}
      />
    </label>
  )
}

export function Select({ label, className = '', children, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>}
      <select
        className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export function Textarea({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>}
      <textarea
        className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30 ${className}`}
        rows={3}
        {...props}
      />
    </label>
  )
}

export function Modal({ open, title, onClose, children, footer, wide }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`animate-fade-in my-8 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-2xl`}>
        <div className="sticky top-0 flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white px-6 py-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Table({ columns, rows, empty }) {
  if (!rows) return <Loading />
  if (!rows.length) return <div className="p-12 text-center text-sm text-slate-400">{empty || '—'}</div>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-start text-xs uppercase tracking-wide text-slate-400">
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 font-semibold whitespace-nowrap">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className="border-b last:border-0 hover:bg-slate-50/70">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3">{c.render ? c.render(r) : r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Badge({ value }) {
  const map = {
    present: 'bg-emerald-100 text-emerald-700', late: 'bg-amber-100 text-amber-700',
    excused: 'bg-blue-100 text-blue-700', absent: 'bg-red-100 text-red-700',
    paid: 'bg-emerald-100 text-emerald-700', unpaid: 'bg-red-100 text-red-700',
    submitted: 'bg-emerald-100 text-emerald-700', graded: 'bg-indigo-100 text-indigo-700',
    active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-slate-100 text-slate-500',
    all: 'bg-navy-700/10 text-navy-700', teachers: 'bg-indigo-100 text-indigo-700',
    students: 'bg-blue-100 text-blue-700', parents: 'bg-purple-100 text-purple-700',
    admin: 'bg-gold/30 text-gold-700', teacher: 'bg-indigo-100 text-indigo-700',
    student: 'bg-emerald-100 text-emerald-700', parent: 'bg-purple-100 text-purple-700'
  }
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[value] || 'bg-slate-100 text-slate-600'}`}>{value}</span>
}

export function Card({ children, className = '' }) {
  return <div className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60 ${className}`}>{children}</div>
}

export function Loading({ label }) {
  return (
    <div className="flex items-center justify-center gap-3 p-10 text-sm text-slate-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      {label || '…'}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Avatar({ user, size = 9 }) {
  const cls = `inline-flex items-center justify-center rounded-full bg-navy-600 font-bold text-gold h-${size} w-${size}`
  if (user?.avatar) return <img src={user.avatar} alt={user.name} className={`h-9 w-9 rounded-full object-cover`} />
  return <span className={cls}>{(user?.name || '?').charAt(0).toUpperCase()}</span>
}

// debounce helper
export function useDebounced(value, ms = 400) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}
