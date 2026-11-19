import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ClubLogo } from '../components/ClubLogo'
import { KanjiBackdrop } from '../components/KanjiBackdrop'
import { TatamiMark } from '../components/TatamiMark'
import { useAuth } from '../hooks/useAuth'
import { getDefaultClub, setDefaultClub, useMyClubs } from '../hooks/useClub'

// Signed out (what the store app opens on): two doors, log in or register
// with the club's code.
function Welcome() {
  const { t } = useTranslation()
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between px-6 pb-[max(env(safe-area-inset-bottom),2rem)] pt-[max(env(safe-area-inset-top),3rem)]">
      <KanjiBackdrop parallax={0.15} baseAlpha={0.08} />
      <div className="kana-vignette" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-[12vh] text-center"
      >
        <TatamiMark className="mx-auto h-20 w-20 text-5xl" />
        <p className="mt-6 font-display text-4xl font-bold uppercase tracking-[0.25em] text-ink">Tatami</p>
        <p className="mx-auto mt-3 max-w-xs text-muted">{t('welcome.tagline')}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm space-y-3"
      >
        <Link
          to="/login"
          className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-ink font-display text-base uppercase tracking-wide text-shiro shadow-[0_16px_32px_-16px_rgba(31,27,22,0.7)] transition-transform active:scale-[0.98]"
        >
          {t('welcome.login')}
        </Link>
        <Link
          to="/register"
          className="flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-ink/80 font-display text-base uppercase tracking-wide text-ink transition-transform active:scale-[0.98]"
        >
          {t('welcome.register')}
        </Link>
        <p className="pt-2 text-center text-xs text-muted">{t('welcome.registerHint')}</p>
      </motion.div>
    </div>
  )
}

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
  if (!session) return <Welcome />

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
