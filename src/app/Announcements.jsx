import { useState } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { api, useApi } from '../lib/api.js'
import { PageHeader, Card, Modal, Btn, Input, Select, Textarea, Badge } from '../components/ui.jsx'
import { toast } from '../main.jsx'

const AUDIENCES = ['all', 'teachers', 'students', 'parents']
const EMPTY = { title: '', body: '', audience: 'all' }

export default function Announcements() {
  const { t } = useI18n()
  const { user } = useAuth()
  const isStaff = ['admin', 'teacher'].includes(user?.role)
  const { data, loading, reload } = useApi('/announcements')
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      if (form.id) await api('/announcements/' + form.id, { method: 'PUT', body: form })
      else await api('/announcements', { method: 'POST', body: form })
      toast(t('common.saved'))
      setForm(null)
      reload()
    } catch (e) { toast(e.message, 'err') }
    setBusy(false)
  }
  const del = async (a) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    await api('/announcements/' + a.id, { method: 'DELETE' })
    reload()
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={'📢 ' + t('nav.announcements')} subtitle={t('feat.8d')}
        action={isStaff && <Btn onClick={() => setForm({ ...EMPTY })}>+ {t('common.add')}</Btn>} />
      {loading ? <Card><p className="p-6 text-center text-slate-400">{t('common.loading')}</p></Card> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(data?.announcements || []).map((a) => (
            <Card key={a.id} className="transition hover:shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-navy">{a.title}</h3>
                <Badge value={a.audience} />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{a.body}</p>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {a.author} • {new Date(a.created_at).toLocaleDateString()}
              </p>
              {isStaff && (
                <div className="mt-3 flex gap-2">
                  <Btn size="sm" variant="soft" onClick={() => setForm({ ...EMPTY, ...a })}>✏️</Btn>
                  <Btn size="sm" variant="danger" onClick={() => del(a)}>🗑</Btn>
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
            <Textarea label="Body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} />
            <Select label={t('an.audience')} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              {AUDIENCES.map((a) => <option key={a} value={a}>{t('aud.' + a)}</option>)}
            </Select>
          </div>
        )}
      </Modal>
    </div>
  )
}
