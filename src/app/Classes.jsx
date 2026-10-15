import { useState } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { api, useApi } from '../lib/api.js'
import { PageHeader, Table, Modal, Btn, Input, Select } from '../components/ui.jsx'
import { toast } from '../main.jsx'

const EMPTY = { name: '', grade: 'Grade 7', teacher_id: '', room: '', capacity: 30 }

export default function Classes() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { data, loading, reload } = useApi('/classes')
  const { data: teachersData } = useApi('/teachers')
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const isAdmin = user?.role === 'admin'

  const save = async () => {
    setBusy(true)
    try {
      const body = { ...form, teacher_id: form.teacher_id || null, capacity: Number(form.capacity) || 30 }
      if (form.id) await api('/classes/' + form.id, { method: 'PUT', body })
      else await api('/classes', { method: 'POST', body })
      toast(t('common.saved'))
      setForm(null)
      reload()
    } catch (e) { toast(e.message, 'err') }
    setBusy(false)
  }

  const del = async (r) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    await api('/classes/' + r.id, { method: 'DELETE' })
    toast(t('common.delete'))
    reload()
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="animate-fade-in">
      <PageHeader title={'🏛️ ' + t('nav.classes')} subtitle={t('feat.5d')}
        action={isAdmin && <Btn onClick={() => setForm({ ...EMPTY })}>+ {t('common.add')}</Btn>} />
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        {loading ? <Table columns={[]} rows={null} /> : (
          <Table
            empty={t('common.none')}
            columns={[
              { key: 'name', label: t('nav.classes'), render: (r) => <span className="font-semibold">{r.name}</span> },
              { key: 'grade', label: t('st.grade') },
              { key: 'teacher_name', label: t('cl.teacher'), render: (r) => r.teacher_name || '—' },
              { key: 'room', label: t('cl.room') },
              { key: 'capacity', label: t('cl.capacity') },
              { key: 'student_count', label: t('cl.students'), render: (r) => <span className="font-bold text-navy">{r.student_count}</span> },
              ...(isAdmin ? [{
                key: 'actions', label: t('common.actions'), render: (r) => (
                  <div className="flex gap-2">
                    <Btn size="sm" variant="soft" onClick={() => setForm({ ...EMPTY, ...r, teacher_id: r.teacher_id || '' })}>✏️</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(r)}>🗑</Btn>
                  </div>
                )
              }] : [])
            ]}
            rows={data?.classes || []}
          />
        )}
      </div>

      <Modal open={!!form} title={form?.id ? t('common.edit') : t('common.add')} onClose={() => setForm(null)}
        footer={<><Btn variant="ghost" onClick={() => setForm(null)}>{t('common.cancel')}</Btn><Btn onClick={save} disabled={busy}>{t('common.save')}</Btn></>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('nav.classes')} value={form.name} onChange={set('name')} placeholder="9-A" />
            <Input label={t('st.grade')} value={form.grade} onChange={set('grade')} />
            <Select label={t('cl.teacher')} value={form.teacher_id} onChange={set('teacher_id')}>
              <option value="">—</option>
              {(teachersData?.teachers || []).map((tc) => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
            </Select>
            <Input label={t('cl.room')} value={form.room} onChange={set('room')} />
            <Input label={t('cl.capacity')} type="number" value={form.capacity} onChange={set('capacity')} />
          </div>
        )}
      </Modal>
    </div>
  )
}
