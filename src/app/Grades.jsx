import { useState } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { api, useApi } from '../lib/api.js'
import { PageHeader, Card, Modal, Btn, Input, Select, Table } from '../components/ui.jsx'
import { toast } from '../main.jsx'

const TYPES = ['exam', 'quiz', 'homework', 'participation']

function StaffGrades() {
  const { t } = useI18n()
  const { data, loading, reload } = useApi('/grades')
  const { data: classesData } = useApi('/classes')
  const { data: subjectsData } = useApi('/subjects')
  const [form, setForm] = useState(null)
  const [roster, setRoster] = useState([])
  const [busy, setBusy] = useState(false)

  const loadRoster = async (classId) => {
    setForm({ ...form, class_id: classId, student_id: '' })
    if (!classId) return setRoster([])
    const r = await api(`/attendance?class_id=${classId}&date=2000-01-01`)
    setRoster(r.records || [])
  }

  const save = async () => {
    setBusy(true)
    try {
      await api('/grades', {
        method: 'POST',
        body: { student_id: Number(form.student_id), subject_id: form.subject_id, type: form.type, score: Number(form.score), max_score: Number(form.max_score) || 100 }
      })
      toast(t('common.saved'))
      setForm(null)
      reload()
    } catch (e) { toast(e.message, 'err') }
    setBusy(false)
  }

  const del = async (g) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    await api('/grades/' + g.id, { method: 'DELETE' })
    reload()
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={'📊 ' + t('nav.grades')} subtitle={t('feat.3d')}
        action={<Btn onClick={() => setForm({ class_id: '', student_id: '', subject_id: '', type: 'exam', score: '', max_score: 100 })}>+ {t('gr.addGrade')}</Btn>} />
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        {loading ? <Table columns={[]} rows={null} /> : (
          <Table
            empty={t('common.none')}
            columns={[
              { key: 'student_name', label: t('nav.students'), render: (r) => <span className="font-semibold">{r.student_name}</span> },
              { key: 'subject_name', label: t('gr.subject') },
              { key: 'type', label: t('gr.type'), render: (r) => t('gr.' + r.type) },
              { key: 'score', label: t('gr.score'), render: (r) => <span className="font-bold text-navy">{r.score} / {r.max_score}</span> },
              { key: 'date', label: t('common.date'), render: (r) => r.date && new Date(r.date).toLocaleDateString() },
              { key: 'actions', label: t('common.actions'), render: (r) => <Btn size="sm" variant="danger" onClick={() => del(r)}>🗑</Btn> }
            ]}
            rows={data?.grades || []}
          />
        )}
      </div>

      <Modal open={!!form} title={t('gr.addGrade')} onClose={() => setForm(null)}
        footer={<><Btn variant="ghost" onClick={() => setForm(null)}>{t('common.cancel')}</Btn><Btn onClick={save} disabled={busy || !form?.student_id || !form?.subject_id || form?.score === ''}>{t('common.save')}</Btn></>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label={t('common.selectClass')} value={form.class_id} onChange={(e) => loadRoster(e.target.value)}>
              <option value="">—</option>
              {(classesData?.classes || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label={t('common.selectStudent')} value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}>
              <option value="">—</option>
              {roster.map((s) => <option key={s.student_id} value={s.student_id}>{s.name}</option>)}
            </Select>
            <Select label={t('gr.subject')} value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
              <option value="">—</option>
              {(subjectsData?.subjects || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select label={t('gr.type')} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((ty) => <option key={ty} value={ty}>{t('gr.' + ty)}</option>)}
            </Select>
            <Input label={t('gr.score')} type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
            <Input label="/ " type="number" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} />
          </div>
        )}
      </Modal>
    </div>
  )
}

function ReportCard() {
  const { t } = useI18n()
  const { data, loading } = useApi('/grades')
  const grades = data?.grades || []
  const bySubject = {}
  for (const g of grades) (bySubject[g.subject_name] = bySubject[g.subject_name] || []).push(g)
  const overall = grades.length
    ? Math.round((grades.reduce((a, g) => a + Number(g.score) / Number(g.max_score), 0) / grades.length) * 100)
    : null

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title={'📊 ' + t('gr.reportCard')} subtitle={t('feat.3d')} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-4xl font-extrabold text-navy">{overall ?? '—'}%</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{t('gr.overall')}</p>
        </Card>
        <Card className="text-center sm:col-span-2">
          <p className="text-4xl font-extrabold text-gold-700">{Object.keys(bySubject).length}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{t('gr.subject')}</p>
        </Card>
      </div>
      {loading ? <Card><p className="p-6 text-center text-slate-400">{t('common.loading')}</p></Card> : (
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(bySubject).map(([subject, list]) => {
            const avg = Math.round((list.reduce((a, g) => a + Number(g.score) / Number(g.max_score), 0) / list.length) * 100)
            return (
              <Card key={subject}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-navy">{subject}</h3>
                  <span className="text-2xl font-extrabold text-gold-700">{avg}%</span>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {list.map((g) => (
                    <li key={g.id} className="flex items-center justify-between text-sm text-slate-500">
                      <span>{g.student_name ? `${g.student_name} — ` : ''}{t('gr.' + g.type)}</span>
                      <span className="font-bold text-navy">{g.score}/{g.max_score}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })}
          {!Object.keys(bySubject).length && <p className="p-10 text-center text-slate-400 md:col-span-2">{t('common.none')}</p>}
        </div>
      )}
    </div>
  )
}

export default function Grades() {
  const { user } = useAuth()
  return user?.role === 'admin' || user?.role === 'teacher' ? <StaffGrades /> : <ReportCard />
}
