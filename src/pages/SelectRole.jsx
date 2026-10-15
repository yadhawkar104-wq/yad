import { useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'
import { Btn } from '../components/ui.jsx'
import { toast } from '../main.jsx'
import { AuthShell } from './Login.jsx'

const ROLES = [
  ['admin', '👑', 'role.admin', 'auth.roleAdminDesc'],
  ['teacher', '👨‍🏫', 'role.teacher', 'auth.roleTeacherDesc'],
  ['student', '🎓', 'role.student', 'auth.roleStudentDesc'],
  ['parent', '👨‍👩‍👧', 'role.parent', 'auth.roleParentDesc']
]

export default function SelectRole() {
  const { t } = useI18n()
  const { user, selectRole } = useAuth()
  const nav = useNavigate()

  const pick = async (role) => {
    try {
      await selectRole(role)
      toast(t('common.welcome') + ', ' + (user?.name || '') + '!')
      nav('/app', { replace: true })
    } catch (e) {
      toast(e.message, 'err')
    }
  }

  return (
    <AuthShell title={t('auth.chooseRole')} subtitle={t('auth.chooseRoleSub')}>
      <div className="grid gap-3 sm:grid-cols-2">
        {ROLES.map(([role, icon, rk, dk]) => (
          <button key={role} onClick={() => pick(role)}
            className="group rounded-2xl border-2 border-slate-100 p-5 text-start transition hover:border-gold hover:bg-gold/5 hover:shadow-lg">
            <span className="text-3xl">{icon}</span>
            <h3 className="mt-2 font-extrabold text-navy">{t(rk)}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{t(dk)}</p>
            <span className="mt-3 inline-block text-xs font-bold text-gold-700 opacity-0 transition group-hover:opacity-100">{t('common.continue')} →</span>
          </button>
        ))}
      </div>
    </AuthShell>
  )
}
