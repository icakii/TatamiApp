import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { ClubLogo } from '../components/ClubLogo'
import { KanjiBackdrop } from '../components/KanjiBackdrop'
import { TatamiMark } from '../components/TatamiMark'
import { useAuth } from '../hooks/useAuth'
import { getDefaultClub, setDefaultClub, useMyClubs } from '../hooks/useClub'

// "/": straight into your club. One club: go. Several: the default one from
// the profile, otherwise pick. None yet: say who to ask.
export function ClubPicker() {
  const { t } = useTranslation()
  const { session, loading, signOut } = useAuth()
  const { data: mine, isLoading } = useMyClubs(session?.user.id)
  const navigate = useNavigate()

  if (loading || (session && isLoading)) {
    return <div className="flex min-h-screen items-center justify-center text-muted">...</div>
  }
  if (!session) return <Navigate to="/login" replace />

  const clubs = mine ?? []
  const preferred = getDefaultClub()
  if (clubs.length === 1) return <Navigate to={`/${clubs[0].club.slug}`} replace />
  if (preferred && clubs.some((m) => m.club.slug === preferred)) return <Navigate to={`/${preferred}`} replace />

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <KanjiBackdrop parallax={0.2} baseAlpha={0.05} />
      <div className="relative w-full max-w-sm text-center">
        <TatamiMark className="mx-auto h-14 w-14 text-3xl" />
        {clubs.length === 0 ? (
          <>
            <p className="mt-6 font-display text-2xl uppercase tracking-wide text-ink">{t('club.noneTitle')}</p>
            <p className="mt-2 text-muted">{t('club.noneBody')}</p>
            <button
              type="button"
              onClick={() => signOut()}
              className="mt-8 min-h-12 w-full rounded-2xl border border-ink/15 font-display text-sm uppercase tracking-wide text-muted"
            >
              {t('profilePage.logout')}
            </button>
          </>
        ) : (
          <>
            <p className="mt-6 font-display text-2xl uppercase tracking-wide text-ink">{t('club.pickTitle')}</p>
            <div className="mt-6 space-y-3">
              {clubs.map((m, i) => (
                <motion.button
                  key={m.club.id}
                  type="button"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.07 }}
                  onClick={() => {
                    setDefaultClub(m.club.slug)
                    navigate(`/${m.club.slug}`)
                  }}
                  className="flex w-full items-center gap-4 rounded-2xl border border-ink/10 bg-shiro/95 p-4 text-left shadow-[0_16px_32px_-24px_rgba(31,27,22,0.55)] transition-transform active:scale-[0.98]"
                >
                  <ClubLogo club={m.club} className="h-12 w-12 text-base" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg uppercase tracking-wide text-ink">{m.club.name}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted">{t(`admin.role.${m.role}`)}</span>
                  </span>
                  <span className="text-xl text-muted">→</span>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
