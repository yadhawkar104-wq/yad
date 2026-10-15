import { useState } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { api, useApi, money } from '../lib/api.js'
import { PageHeader, Card, Modal, Btn, Input, Select, Table, Badge } from '../components/ui.jsx'
import { toast } from '../main.jsx'

const EMPTY = { student_id: '', title: '', amount: '', due_date: '' }

function AdminFees() {
  const { t } = useI18n()
  const { data, loading, reload } = useApi('/fees')
  const { data: studentsData } = useApi('/students')
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const body = { ...form, student_id: Number(form.student_id), amount: Number(form.amount) }
      if (form.id) await api('/fees/' + form.id, { method: 'PUT', body })
      else await api('/fees', { method: 'POST', body })
      toast(t('common.saved'))
      setForm(null)
      reload()
    } catch (e) { toast(e.message, 'err') }
    setBusy(false)
  }
  const del = async (f) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    await api('/fees/' + f.id, { method: 'DELETE' })
    reload()
  }
  const toggle = async (f) => {
    await api('/fees/' + f.id + '/pay', { method: 'POST' })
    reload()
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={'💳 ' + t('nav.fees')} subtitle={t('feat.6d')}
        action={<Btn onClick={() => setForm({ ...EMPTY })}>+ {t('common.add')}</Btn>} />
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        {loading ? <Table columns={[]} rows={null} /> : (
          <Table
            empty={t('common.none')}
            columns={[
              { key: 'student_name', label: t('nav.students'), render: (r) => <span className="font-semibold">{r.student_name}</span> },
              { key: 'title', label: t('common.name') },
              { key: 'amount', label: t('fe.amount'), render: (r) => <span className="font-bold text-navy">{money(r.amount)}</span> },
              { key: 'due_date', label: t('fe.dueDate') },
              { key: 'status', label: t('common.status'), render: (r) => <Badge value={r.status} /> },
              {
                key: 'actions', label: t('common.actions'), render: (r) => (
                  <div className="flex gap-2">
                    <Btn size="sm" variant={r.status === 'paid' ? 'soft' : 'gold'} onClick={() => toggle(r)}>{t('fe.markPaid')}</Btn>
                    <Btn size="sm" variant="soft" onClick={() => setForm({ ...EMPTY, ...r, due_date: r.due_date?.slice(0, 10) || '' })}>✏️</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(r)}>🗑</Btn>
                  </div>
                )
              }
            ]}
            rows={data?.fees || []}
          />
        )}
      </div>
      <Modal open={!!form} title={form?.id ? t('common.edit') : t('common.add')} onClose={() => setForm(null)}
        footer={<><Btn variant="ghost" onClick={() => setForm(null)}>{t('common.cancel')}</Btn><Btn onClick={save} disabled={busy || !form?.student_id || !form?.amount}>{t('common.save')}</Btn></>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label={t('common.selectStudent')} value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="sm:col-span-2">
              <option value="">—</option>
              {(studentsData?.students || []).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.admission_no})</option>)}
            </Select>
            <Input label={t('common.name')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tuition — Term 1" />
            <Input label={t('fe.amount')} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input label={t('fe.dueDate')} type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
        )}
      </Modal>
    </div>
  )
}

function MyFees() {
  const { t } = useI18n()
  const { data, loading } = useApi('/fees')
  const fees = data?.fees || []
  const due = fees.filter((f) => f.status === 'unpaid').reduce((a, f) => a + Number(f.amount), 0)
  const paid = fees.filter((f) => f.status === 'paid').reduce((a, f) => a + Number(f.amount), 0)
  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title={'💳 ' + t('nav.fees')} subtitle={t('feat.6d')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-s-4 border-s-red-500">
          <p className="text-xs font-semibold uppercase text-slate-400">{t('fe.totalDue')}</p>
          <p className="mt-1 text-3xl font-extrabold text-red-600">{money(due)}</p>
        </Card>
        <Card className="border-s-4 border-s-emerald-500">
          <p className="text-xs font-semibold uppercase text-slate-400">{t('fe.totalPaid')}</p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-600">{money(paid)}</p>
        </Card>
      </div>
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        {loading ? <Table columns={[]} rows={null} /> : (
          <Table
            empty={t('common.none')}
            columns={[
              { key: 'student_name', label: t('nav.students') },
              { key: 'title', label: t('common.name') },
              { key: 'amount', label: t('fe.amount'), render: (r) => <span className="font-bold text-navy">{money(r.amount)}</span> },
              { key: 'due_date', label: t('fe.dueDate') },
              { key: 'status', label: t('common.status'), render: (r) => <Badge value={r.status} /> }
            ]}
            rows={fees}
          />
        )}
      </div>
    </div>
  )
}

export default function Fees() {
  const { user } = useAuth()
  return user?.role === 'admin' ? <AdminFees /> : <MyFees />
}
