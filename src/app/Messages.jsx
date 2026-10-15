import { useState } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { api, useApi } from '../lib/api.js'
import { PageHeader, Card, Btn, Avatar } from '../components/ui.jsx'

export default function Messages() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { data: contactsData } = useApi('/contacts')
  const [partner, setPartner] = useState(null)
  const { data, reload } = useApi(partner ? `/messages?with=${partner.id}` : null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const send = async () => {
    if (!draft.trim()) return
    setBusy(true)
    try {
      await api('/messages', { method: 'POST', body: { receiver_id: partner.id, body: draft } })
      setDraft('')
      reload()
    } catch (e) { setBusy(false) }
    setBusy(false)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={'✉️ ' + t('nav.messages')} subtitle={t('feat.9d')} />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Contacts */}
        <Card className="max-h-[70vh] overflow-y-auto !p-3">
          <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{t('ms.people')}</p>
          <ul className="space-y-1">
            {(contactsData?.contacts || []).map((c) => (
              <li key={c.id}>
                <button onClick={() => setPartner(c)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${partner?.id === c.id ? 'bg-gold/15 ring-1 ring-gold/50' : 'hover:bg-slate-50'}`}>
                  <Avatar user={c} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-navy">{c.name}</span>
                    <span className="block text-[11px] text-slate-400">{t('role.' + c.role) || ''}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* Conversation */}
        <Card className="flex max-h-[70vh] min-h-[420px] flex-col !p-0">
          {!partner ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">{t('ms.selectChat')}</div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
                <Avatar user={partner} />
                <div>
                  <p className="text-sm font-bold text-navy">{partner.name}</p>
                  <p className="text-xs text-slate-400">{t('role.' + partner.role)}</p>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {(data?.messages || []).map((m) => {
                  const mine = m.sender_id === user.id
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-gold text-navy rounded-ee-sm' : 'bg-navy-700 text-white rounded-es-sm'}`}>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className={`mt-1 text-[10px] ${mine ? 'text-navy/50' : 'text-white/50'}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send() }} className="flex gap-2 border-t border-slate-100 p-4">
                <input value={draft} onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('ms.typeMessage')}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-gold focus:ring-2 focus:ring-gold/30" />
                <Btn disabled={busy || !draft.trim()}>{t('ms.send')} ➤</Btn>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
