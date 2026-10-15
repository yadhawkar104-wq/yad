import { useState } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { api, useApi } from '../lib/api.js'
import { PageHeader, Card, Modal, Btn, Input, Select } from '../components/ui.jsx'
import { toast } from '../main.jsx'

const DAYS = [['tt.mon', 0], ['tt.tue', 1], ['tt.wed', 2], ['tt.thu', 3], ['tt.fri', 4]]
const TIMES = [['08:00', '09:00'], ['09:00', '10:00'], ['10:15', '11:15'], ['11:15', '12:15'], ['12:30', '13:30']]

export default function Timetable() {
  const { t } = useI18n()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { data: classesData } = useApi('/classes')
  const { data: subjectsData } = useApi('/subjects')
  const [classId, setClassId] = useState('')
  const { data, loading, reload } = useApi(`/timetable${classId ? `?class_id=${classId}` : ''}`)
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)

  const entries = data?.timetable || []

  const save = async () => {
    setBusy(true)
    try {
      await api('/timetable', { method: 'POST', body: { ...form, class_id: form.class_id || data?.class_id, subject_id: Number(form.subject_id), day: Number(form.day) } })
      toast(t('common.saved'))
      setForm(null)
      reload()
    } catch (e) { toast(e.message, 'err') }
    setBusy(false)
  }
  const del = async (e) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    await api('/timetable/' + e.id, { method: 'DELETE' })
    reload()
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={'🗓️ ' + t('nav.timetable')} subtitle={t('feat.5d')}
        action={isAdmin && data?.class_id && <Btn onClick={() => setForm({ day: 0, subject_id: '', start_time: TIMES[0][0], end_time: TIMES[0][1], room: '', class_id: data.class_id })}>+ {t('common.add')}</Btn>} />
      {(isAdmin || user?.role === 'teacher') && (
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <Select className="min-w-44" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">{t('common.selectClass')}</option>
            {(classesData?.classes || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
      )}
      {loading ? <Card><p className="p-6 text-center text-slate-400">{t('common.loading')}</p></Card> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DAYS.map(([key, day]) => {
            const list = entries.filter((e) => e.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time))
            return (
              <Card key={key}>
                <h3 className="mb-3 font-extrabold text-navy">{t(key)}</h3>
                {list.length ? (
                  <ul className="space-y-2">
                    {list.map((e) => (
                      <li key={e.id} className="flex items-center gap-3 rounded-xl bg-navy-700/5 p-3">
                        <div className="w-14 shrink-0 text-center text-xs font-bold text-navy-600">{e.start_time}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-navy">{e.subject_name}</p>
                          <p className="text-xs text-slate-500">{t('tt.room')} {e.room}</p>
                        </div>
                        {isAdmin && <button onClick={() => del(e)} className="text-slate-300 hover:text-red-500">🗑</button>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-4 text-center text-xs text-slate-400">{t('tt.noClasses')}</p>
                )}
              </Card>
            )
          })}
        </div>
      )}
      <div className="mt-6 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200/60">
        <span className="font-bold text-navy">{t('nav.classes')}:</span> {data?.class_id ? (classesData?.classes || []).find((c) => c.id === data.class_id)?.name : '—'}
      </div>

      <Modal open={!!form} title={t('common.add')} onClose={() => setForm(null)}
        footer={<><Btn variant="ghost" onClick={() => setForm(null)}>{t('common.cancel')}</Btn><Btn onClick={save} disabled={busy || !form?.subject_id}>{t('common.save')}</Btn></>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            {isAdmin && (
              <Select label={t('common.selectClass')} value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
                <option value="">—</option>
                {(classesData?.classes || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
            <Select label={t('tt.day')} value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
              {DAYS.map(([k, d]) => <option key={d} value={d}>{t(k)}</option>)}
            </Select>
            <Select label={t('gr.subject')} value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
              <option value="">—</option>
              {(subjectsData?.subjects || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select label="Start" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}>
              {TIMES.map(([s]) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select label="End" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}>
              {TIMES.map(([, e]) => <option key={e} value={e}>{e}</option>)}
            </Select>
            <Input label={t('tt.room')} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          </div>
        )}
      </Modal>
    </div>
  )
}
