import { useState } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { api, useApi } from '../lib/api.js'
import { PageHeader, Card, Modal, Btn, Input, useDebounced } from '../components/ui.jsx'
import { toast } from '../main.jsx'

const EMPTY = { title: '', author: '', isbn: '', category: '', copies: 1 }

export default function Library() {
  const { t } = useI18n()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isStudent = user?.role === 'student'
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const { data, loading, reload } = useApi(`/books?search=${encodeURIComponent(debounced)}`)
  const { data: myBorrows, reload: reloadBorrows } = useApi(isStudent ? '/borrows/my' : null)
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)

  const activeBorrow = (bookId) => (myBorrows?.borrows || []).find((b) => b.book_id === bookId && !b.returned_at)

  const save = async () => {
    setBusy(true)
    try {
      const body = { ...form, copies: Number(form.copies) || 1 }
      if (form.id) await api('/books/' + form.id, { method: 'PUT', body })
      else await api('/books', { method: 'POST', body })
      toast(t('common.saved'))
      setForm(null)
      reload()
    } catch (e) { toast(e.message, 'err') }
    setBusy(false)
  }
  const del = async (b) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    await api('/books/' + b.id, { method: 'DELETE' })
    reload()
  }
  const borrow = async (b) => {
    try {
      await api('/books/' + b.id + '/borrow', { method: 'POST' })
      toast('📚 ' + t('li.borrow'))
      reload(); reloadBorrows()
    } catch (e) { toast(e.message, 'err') }
  }
  const returnBook = async (b) => {
    await api('/borrows/return', { method: 'POST', body: { id: activeBorrow(b.id).id } })
    toast('✅ ' + t('li.return'))
    reload(); reloadBorrows()
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={'📚 ' + t('nav.library')} subtitle={t('feat.7d')}
        action={isAdmin && <Btn onClick={() => setForm({ ...EMPTY })}>+ {t('common.add')}</Btn>} />
      <div className="mb-5"><Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      {loading ? <Card><p className="p-6 text-center text-slate-400">{t('common.loading')}</p></Card> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(data?.books || []).map((b) => {
            const ab = isStudent ? activeBorrow(b.id) : null
            return (
              <Card key={b.id} className="flex flex-col transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="mb-3 flex h-28 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-navy-600 text-5xl shadow-inner">📖</div>
                <h3 className="font-bold text-navy">{b.title}</h3>
                <p className="text-xs text-slate-500">{t('li.author')}: {b.author}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold-700">{b.category}</span>
                  <span className="text-[11px] font-semibold text-slate-400">{t('li.available')}: {b.available}/{b.copies}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {isStudent && (ab
                    ? <Btn size="sm" variant="gold" onClick={() => returnBook(b)}>↩ {t('li.return')}</Btn>
                    : <Btn size="sm" variant="soft" disabled={b.available < 1} onClick={() => borrow(b)}>{t('li.borrow')}</Btn>)}
                  {isAdmin && (
                    <>
                      <Btn size="sm" variant="soft" onClick={() => setForm({ ...EMPTY, ...b })}>✏️</Btn>
                      <Btn size="sm" variant="danger" onClick={() => del(b)}>🗑</Btn>
                    </>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
      <Modal open={!!form} title={form?.id ? t('common.edit') : t('common.add')} onClose={() => setForm(null)}
        footer={<><Btn variant="ghost" onClick={() => setForm(null)}>{t('common.cancel')}</Btn><Btn onClick={save} disabled={busy}>{t('common.save')}</Btn></>}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('common.name')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label={t('li.author')} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            <Input label="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
            <Input label={t('li.category')} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label={t('li.copies')} type="number" value={form.copies} onChange={(e) => setForm({ ...form, copies: e.target.value })} />
          </div>
        )}
      </Modal>
    </div>
  )
}
