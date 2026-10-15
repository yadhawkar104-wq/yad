import { useState } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { api, useApi } from '../lib/api.js'
import { PageHeader, Card, Modal, Btn, Input, Select, Textarea, Badge } from '../components/ui.jsx'
import { toast } from '../main.jsx'

const EMPTY = { class_id: '', subject_id: '', title: '', description: '', due_date: '', points: 100 }

function StaffAssignments() {
  const { t } = useI18n()
  const { data, loading, reload } = useApi('/assignments')
  const { data: classesData } = useApi('/classes')
  const { data: subjectsData } = useApi('/subjects')
  const [form, setForm] = useState(null)
  const [subsFor, setSubsFor] = useState(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const body = { ...form, subject_id: form.subject_id || null, points: Number(form.points) || 100 }
      if (form.id) await api('/assignments/' + form.id, { method: 'PUT', body })
      else await api('/assignments', { method: 'POST', body })
      toast(t('common.saved'))
      setForm(null)
      reload()
    } catch (e) { toast(e.message, 'err') }
    setBusy(false)
  }
  const del = async (r) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    await api('/assignments/' + r.id, { method: 'DELETE' })
    toast(t('common.delete'))
    reload()
  }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="animate-fade-in">
      <PageHeader title={'📝 ' + t('nav.assignments')} subtitle={t('feat.4d')}
        action={<Btn onClick={() => setForm({ ...EMPTY })}>+ {t('common.add')}</Btn>} />
      {loading ? <Card><p className="p-6 text-center text-slate-400">{t('common.loading')}</p></Card> : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data?.assignments || []).map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-navy">{a.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{a.class_name} • {a.subject_name || '—'}</p>
                </div>
                <Badge value={a.submission_count + ' ' + t('as.submissions')} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">{a.description}</p>
              <p className="mt-2 text-xs font-semibold text-slate-400">📅 {t('as.due')}: {a.due_date} • ⭐ {a.points} {t('as.points')}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Btn size="sm" variant="soft" onClick={() => setSubsFor(a)}>📋 {t('as.submissions')} ({a.submission_count})</Btn>
                <Btn size="sm" variant="soft" onClick={() => setForm({ ...EMPTY, ...a, due_date: a.due_date?.slice(0, 10) || '' })}>✏️</Btn>
                <Btn size="sm" variant="danger" onClick={() => del(a)}>🗑</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!form} title={form?.id ? t('common.edit') : t('common.add')} onClose={() => setForm(null)}
        footer={<><Btn variant="ghost" onClick={() => setForm(null)}>{t('common.cancel')}</Btn><Btn onClick={save} disabled={busy}>{t('common.save')}</Btn></>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label={t('common.selectClass')} value={form.class_id} onChange={set('class_id')}>
              <option value="">—</option>
              {(classesData?.classes || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label={t('gr.subject')} value={form.subject_id} onChange={set('subject_id')}>
              <option value="">—</option>
              {(subjectsData?.subjects || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Input label={t('common.name')} value={form.title} onChange={set('title')} className="sm:col-span-2" />
            <Textarea label={t('an.audience') + ' / ' + t('common.name')} value={form.description} onChange={set('description')} className="sm:col-span-2" />
            <Input label={t('as.due')} type="date" value={form.due_date} onChange={set('due_date')} />
            <Input label={t('as.points')} type="number" value={form.points} onChange={set('points')} />
          </div>
        )}
      </Modal>

      <SubmissionsModal assignment={subsFor} onClose={() => setSubsFor(null)} />
    </div>
  )
}

function SubmissionsModal({ assignment, onClose }) {
  const { t } = useI18n()
  const { data } = useApi(assignment ? `/assignments/${assignment.id}/submissions` : null)
  const [edits, setEdits] = useState({})
  const save = async (s) => {
    const e = edits[s.id] || {}
    try {
      await api('/submissions/' + s.id, { method: 'PATCH', body: { grade: e.grade ?? s.grade, feedback: e.feedback ?? s.feedback } })
      toast(t('common.saved'))
    } catch (err) { toast(err.message, 'err') }
  }
  return (
    <Modal open={!!assignment} wide title={`📋 ${assignment?.title} — ${t('as.submissions')}`} onClose={onClose}>
      <div className="space-y-4">
        {(data?.submissions || []).map((s) => (
          <div key={s.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <p className="font-bold text-navy">{s.student_name} <span className="text-xs font-normal text-slate-400">• {new Date(s.submitted_at).toLocaleString()}</span></p>
            <p className="mt-2 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm text-slate-600 ring-1 ring-slate-100">{s.content}</p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <Input label={t('gr.score')} type="number" className="w-24" defaultValue={s.grade ?? ''}
                onChange={(e) => setEdits({ ...edits, [s.id]: { ...edits[s.id], grade: e.target.value } })} />
              <Input label={t('as.feedback')} className="flex-1" defaultValue={s.feedback || ''}
                onChange={(e) => setEdits({ ...edits, [s.id]: { ...edits[s.id], feedback: e.target.value } })} />
              <Btn size="sm" onClick={() => save(s)}>{t('common.save')}</Btn>
            </div>
          </div>
        ))}
        {data && !data.submissions.length && <p className="p-8 text-center text-slate-400">{t('common.none')}</p>}
      </div>
    </Modal>
  )
}

function StudentAssignments() {
  const { t } = useI18n()
  const { data, loading, reload } = useApi('/assignments')
  const [submitFor, setSubmitFor] = useState(null)
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await api(`/assignments/${submitFor.id}/submit`, { method: 'POST', body: { content } })
      toast(t('as.submitted'))
      setSubmitFor(null)
      setContent('')
      reload()
    } catch (e) { toast(e.message, 'err') }
    setBusy(false)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={'📝 ' + t('nav.assignments')} subtitle={t('feat.4d')} />
      {loading ? <Card><p className="p-6 text-center text-slate-400">{t('common.loading')}</p></Card> : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data?.assignments || []).map((a) => (
            <Card key={a.id} className={a.my_grade != null ? 'ring-gold/60' : ''}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-navy">{a.title}</h3>
                {a.my_grade != null ? <Badge value="graded" /> : a.my_submission_id ? <Badge value="submitted" /> : <Badge value="notSubmitted" />}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{a.class_name} • {a.subject_name || '—'}</p>
              <p className="mt-2 text-sm text-slate-500">{a.description}</p>
              <p className="mt-2 text-xs font-semibold text-slate-400">📅 {t('as.due')}: {a.due_date} • ⭐ {a.points} {t('as.points')}</p>
              {a.my_grade != null && (
                <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-sm font-bold text-gold-700">{t('as.myGrade')}: {a.my_grade}/{a.points} {a.my_feedback && <>— {a.my_feedback}</>}</p>
              )}
              <Btn size="sm" variant="soft" className="mt-3" onClick={() => { setSubmitFor(a); setContent('') }}>
                ✍️ {t('as.submitWork')}
              </Btn>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!submitFor} title={submitFor?.title} onClose={() => setSubmitFor(null)}
        footer={<><Btn variant="ghost" onClick={() => setSubmitFor(null)}>{t('common.cancel')}</Btn><Btn onClick={submit} disabled={busy || !content.trim()}>{t('common.submit')}</Btn></>}>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('ms.typeMessage')} rows={6} />
      </Modal>
    </div>
  )
}

export default function Assignments() {
  const { user } = useAuth()
  return user?.role === 'student' ? <StudentAssignments /> : <StaffAssignments />
}
