import { useState } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { api, useApi } from '../lib/api.js'
import { PageHeader, Card, Modal, Btn, Input, Textarea } from '../components/ui.jsx'
import { toast } from '../main.jsx'

const EMPTY = { title: '', description: '', date: '', location: '' }

export default function Events() {
  const { t } = useI18n()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { data, loading, reload } = useApi('/events')
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      if (form.id) await api('/events/' + form.id, { method: 'PUT', body: form })
      else await api('/events', { method: 'POST', body: form })
      toast(t('common.saved'))
      setForm(null)
      reload()
    } catch (e) { toast(e.message, 'err') }
    setBusy(false)
  }
  const del = async (e) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    await api('/events/' + e.id, { method: 'DELETE' })
    reload()
  }

  const today = new Date().toISOString().slice(0, 10)
  const events = (data?.events || []).map((e) => ({ ...e, upcoming: e.date >= today }))

  return (
    <div className="animate-fade-in">
      <PageHeader title={'🎉 ' + t('nav.events')} subtitle={t('feat.8d')}
        action={isAdmin && <Btn onClick={() => setForm({ ...EMPTY })}>+ {t('common.add')}</Btn>} />
      {loading ? <Card><p className="p-6 text-center text-slate-400">{t('common.loading')}</p></Card> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((e) => (
            <Card key={e.id} className={e.upcoming ? 'ring-gold/50' : 'opacity-75'}>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-navy text-gold">
                  <span className="text-2xl font-extrabold leading-none">{new Date(e.date).getDate()}</span>
                  <span className="text-[10px] font-bold uppercase">{new Date(e.date).toLocaleString('en', { month: 'short' })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-navy">{e.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{e.description}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-400">📍 {e.location}</p>
                </div>
              </div>
              {isAdmin && (
                <div className="mt-3 flex gap-2">
                  <Btn size="sm" variant="soft" onClick={() => setForm({ ...EMPTY, ...e, date: e.date?.slice(0, 10) })}>✏️</Btn>
                  <Btn size="sm" variant="danger" onClick={() => del(e)}>🗑</Btn>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!form} title={form?.id ? t('common.edit') : t('common.add')} onClose={() => setForm(null)}
        footer={<><Btn variant="ghost" onClick={() => setForm(null)}>{t('common.cancel')}</Btn><Btn onClick={save} disabled={busy}>{t('common.save')}</Btn></>}>
        {form && (
          <div className="space-y-4">
            <Input label={t('common.name')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t('common.date')} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Input label={t('ev.location')} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
