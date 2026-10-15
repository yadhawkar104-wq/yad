import { useState } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { api, useApi } from '../lib/api.js'
import { PageHeader, Table, Modal, Btn, Input, Select, Badge } from '../components/ui.jsx'
import { toast } from '../main.jsx'

const EMPTY = { name: '', admission_no: '', grade: 'Grade 7', section: 'A', class_id: '', guardian_name: '', guardian_phone: '', dob: '', address: '', status: 'active' }
const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

export default function Students() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { data, loading, reload } = useApi('/students')
  const { data: classesData } = useApi('/classes')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)

  if (user?.role !== 'admin') return <p className="text-slate-500">{t('err.forbidden')}</p>

  const students = (data?.students || []).filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.admission_no.toLowerCase().includes(search.toLowerCase())
  )

  const save = async () => {
    setBusy(true)
    try {
      const body = { ...form, class_id: form.class_id || null }
      if (form.id) await api('/students/' + form.id, { method: 'PUT', body })
      else await api('/students', { method: 'POST', body })
      toast(t('common.saved'))
      setForm(null)
      reload()
    } catch (e) {
      toast(e.message, 'err')
    }
    setBusy(false)
  }

  const del = async (s) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    await api('/students/' + s.id, { method: 'DELETE' })
    toast(t('common.delete'))
    reload()
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="animate-fade-in">
      <PageHeader title={'👥 ' + t('nav.students')} subtitle={t('feat.1d')}
        action={<Btn onClick={() => setForm({ ...EMPTY })}>+ {t('common.add')}</Btn>} />
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <div className="p-4"><Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        {loading ? <Table columns={[]} rows={null} /> : (
          <Table
            empty={t('common.none')}
            columns={[
              { key: 'admission_no', label: t('st.admissionNo') },
              { key: 'name', label: t('common.name'), render: (r) => <span className="font-semibold">{r.name}</span> },
              { key: 'class_name', label: t('nav.classes'), render: (r) => r.class_name || '—' },
              { key: 'guardian_name', label: t('st.guardian') },
              { key: 'guardian_phone', label: t('common.phone') },
              { key: 'status', label: t('common.status'), render: (r) => <Badge value={r.status} /> },
              {
                key: 'actions', label: t('common.actions'), render: (r) => (
                  <div className="flex gap-2">
                    <Btn size="sm" variant="soft" onClick={() => setForm({ ...EMPTY, ...r, dob: r.dob?.slice(0, 10) || '', class_id: r.class_name ? r.class_id : '' })}>✏️</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(r)}>🗑</Btn>
                  </div>
                )
              }
            ]}
            rows={students}
          />
        )}
      </div>

      <Modal open={!!form} title={form?.id ? t('common.edit') : t('common.add')} onClose={() => setForm(null)}
        footer={<><Btn variant="ghost" onClick={() => setForm(null)}>{t('common.cancel')}</Btn><Btn onClick={save} disabled={busy}>{t('common.save')}</Btn></>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('common.name')} value={form.name} onChange={set('name')} />
            <Input label={t('st.admissionNo')} value={form.admission_no} onChange={set('admission_no')} />
            <Select label={t('st.grade')} value={form.grade} onChange={set('grade')}>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </Select>
            <Select label={t('nav.classes')} value={form.class_id} onChange={set('class_id')}>
              <option value="">—</option>
              {(classesData?.classes || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label={t('st.section')} value={form.section} onChange={set('section')} />
            <Input label={t('st.dob')} type="date" value={form.dob} onChange={set('dob')} />
            <Input label={t('st.guardian')} value={form.guardian_name} onChange={set('guardian_name')} />
            <Input label={t('common.phone')} value={form.guardian_phone} onChange={set('guardian_phone')} />
            <Input label={t('st.address')} value={form.address} onChange={set('address')} className="sm:col-span-2" />
            <Select label={t('common.status')} value={form.status} onChange={set('status')}>
              <option value="active">{t('common.active')}</option>
              <option value="inactive">{t('common.inactive')}</option>
            </Select>
          </div>
        )}
      </Modal>
    </div>
  )
}
