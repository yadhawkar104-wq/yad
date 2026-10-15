import { useState } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { api, useApi } from '../lib/api.js'
import { PageHeader, Table, Modal, Btn, Input } from '../components/ui.jsx'
import { toast } from '../main.jsx'

const EMPTY = { name: '', email: '', phone: '', subject: '', hire_date: '' }

export default function Teachers() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { data, loading, reload } = useApi('/teachers')
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)

  if (user?.role !== 'admin') return <p className="text-slate-500">{t('err.forbidden')}</p>

  const save = async () => {
    setBusy(true)
    try {
      if (form.id) await api('/teachers/' + form.id, { method: 'PUT', body: form })
      else await api('/teachers', { method: 'POST', body: form })
      toast(t('common.saved'))
      setForm(null)
      reload()
    } catch (e) { toast(e.message, 'err') }
    setBusy(false)
  }

  const del = async (r) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    await api('/teachers/' + r.id, { method: 'DELETE' })
    toast(t('common.delete'))
    reload()
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="animate-fade-in">
      <PageHeader title={'👨‍🏫 ' + t('nav.teachers')} subtitle={t('feat.1d')}
        action={<Btn onClick={() => setForm({ ...EMPTY })}>+ {t('common.add')}</Btn>} />
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        {loading ? <Table columns={[]} rows={null} /> : (
          <Table
            empty={t('common.none')}
            columns={[
              { key: 'name', label: t('common.name'), render: (r) => <span className="font-semibold">{r.name}</span> },
              { key: 'subject', label: t('te.subject') },
              { key: 'email', label: t('common.email') },
              { key: 'phone', label: t('common.phone') },
              { key: 'hire_date', label: t('te.hireDate') },
              {
                key: 'actions', label: t('common.actions'), render: (r) => (
                  <div className="flex gap-2">
                    <Btn size="sm" variant="soft" onClick={() => setForm({ ...EMPTY, ...r, hire_date: r.hire_date?.slice(0, 10) || '' })}>✏️</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(r)}>🗑</Btn>
                  </div>
                )
              }
            ]}
            rows={data?.teachers || []}
          />
        )}
      </div>

      <Modal open={!!form} title={form?.id ? t('common.edit') : t('common.add')} onClose={() => setForm(null)}
        footer={<><Btn variant="ghost" onClick={() => setForm(null)}>{t('common.cancel')}</Btn><Btn onClick={save} disabled={busy}>{t('common.save')}</Btn></>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('common.name')} value={form.name} onChange={set('name')} />
            <Input label={t('te.subject')} value={form.subject} onChange={set('subject')} />
            <Input label={t('common.email')} value={form.email} onChange={set('email')} />
            <Input label={t('common.phone')} value={form.phone} onChange={set('phone')} />
            <Input label={t('te.hireDate')} type="date" value={form.hire_date} onChange={set('hire_date')} />
          </div>
        )}
      </Modal>
    </div>
  )
}
