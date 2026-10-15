import { useState, useEffect } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { api } from '../lib/api.js'
import { PageHeader, Card, Btn, Input, Badge, Avatar } from '../components/ui.jsx'
import { toast } from '../main.jsx'

export default function Profile() {
  const { t } = useI18n()
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setName(user?.name || ''); setPhone(user?.phone || ''); setAvatar(user?.avatar || '')
  }, [user])

  const saveInfo = async () => {
    setBusy(true)
    try {
      const r = await api('/users/me', { method: 'PATCH', body: { name, phone, avatar } })
      setUser(r.user)
      toast(t('common.saved'))
    } catch (e) { toast(e.message, 'err') }
    setBusy(false)
  }

  const changePw = async () => {
    try {
      await api('/users/me/password', { method: 'POST', body: { current: cur, next } })
      setCur(''); setNext('')
      toast(t('common.saved'))
    } catch (e) {
      toast(e.message === 'wrong_password' ? t('pf.currentPassword') : e.message === 'social_account' ? t('pf.socialNote') : e.message, 'err')
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={'⚙️ ' + t('nav.profile')} subtitle={t('pf.updateInfo')} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-navy text-2xl font-extrabold text-gold">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : (user?.name || '?').charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="font-bold text-navy">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
              <div className="mt-1.5"><Badge value={user?.role} /></div>
            </div>
          </div>
          <div className="space-y-4">
            <Input label={t('common.name')} value={name} onChange={(e) => setName(e.target.value)} />
            <Input label={t('common.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label={t('pf.avatarUrl')} value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
            <Btn onClick={saveInfo} disabled={busy}>{t('common.save')}</Btn>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-navy">🔒 {t('pf.changePassword')}</h3>
          {user?.provider === 'local' ? (
            <div className="mt-4 space-y-4">
              <Input label={t('pf.currentPassword')} type="password" value={cur} onChange={(e) => setCur(e.target.value)} />
              <Input label={t('pf.newPassword')} type="password" value={next} onChange={(e) => setNext(e.target.value)} />
              <Btn variant="navy" onClick={changePw} disabled={!cur || next.length < 6}>{t('common.save')}</Btn>
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{t('pf.socialNote')}</p>
          )}
        </Card>
      </div>
    </div>
  )
}
