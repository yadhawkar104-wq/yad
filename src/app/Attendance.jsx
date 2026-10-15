import { useState } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { api, useApi, todayStr } from '../lib/api.js'
import { PageHeader, Card, Select, Btn, Table, Badge } from '../components/ui.jsx'
import { toast } from '../main.jsx'

const STATUSES = ['present', 'late', 'absent', 'excused']
const colors = {
  present: 'bg-emerald-500 text-white', late: 'bg-amber-500 text-white',
  absent: 'bg-red-500 text-white', excused: 'bg-blue-500 text-white'
}

function MarkAttendance() {
  const { t } = useI18n()
  const { data: classesData } = useApi('/classes')
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(todayStr())
  const { data, reload } = useApi(classId ? `/attendance?class_id=${classId}&date=${date}` : null)
  const [marks, setMarks] = useState({})
  const [busy, setBusy] = useState(false)

  const records = data?.records || []
  const markOf = (r) => marks[r.student_id] ?? r.status ?? 'present'
  const setMark = (id, st) => setMarks({ ...marks, [id]: st })

  const save = async () => {
    setBusy(true)
    try {
      await api('/attendance', {
        method: 'POST',
        body: { class_id: classId, date, records: records.map((r) => ({ student_id: r.student_id, status: markOf(r) })) }
      })
      toast(t('common.saved'))
      setMarks({})
      reload()
    } catch (e) { toast(e.message, 'err') }
    setBusy(false)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={'✅ ' + t('att.mark')} subtitle={t('feat.2d')} />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Select className="min-w-44" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">{t('common.selectClass')}</option>
          {(classesData?.classes || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-gold focus:ring-2 focus:ring-gold/30" />
        {classId && records.length > 0 && <Btn onClick={save} disabled={busy}>{t('common.save')}</Btn>}
      </div>
      {classId && (
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.student_id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60">
              <span className="font-semibold text-navy">{r.name}</span>
              <div className="flex gap-2">
                {STATUSES.map((st) => (
                  <button key={st} onClick={() => setMark(r.student_id, st)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${markOf(r) === st ? colors[st] : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {t('att.' + st)}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!records.length && <p className="p-10 text-center text-slate-400">{t('common.none')}</p>}
        </div>
      )}
      {!classId && <p className="p-10 text-center text-slate-400">{t('common.selectClass')}</p>}
    </div>
  )
}

function AttendanceHistory() {
  const { t } = useI18n()
  const { data } = useApi('/attendance')
  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title={'✅ ' + t('att.history')} subtitle={t('feat.2d')} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-4xl font-extrabold text-emerald-600">{data?.rate ?? '—'}%</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{t('att.rate')}</p>
        </Card>
      </div>
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <Table
          empty={t('common.none')}
          columns={[
            { key: 'date', label: t('common.date'), render: (r) => new Date(r.date).toLocaleDateString() },
            { key: 'class_name', label: t('nav.classes') },
            { key: 'status', label: t('common.status'), render: (r) => <Badge value={r.status} /> }
          ]}
          rows={data?.records || []}
        />
      </div>
    </div>
  )
}

export default function Attendance() {
  const { user } = useAuth()
  return user?.role === 'admin' || user?.role === 'teacher' ? <MarkAttendance /> : <AttendanceHistory />
}
