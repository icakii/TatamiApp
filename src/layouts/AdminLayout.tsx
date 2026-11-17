import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom'
import { KanjiBackdrop } from '../components/KanjiBackdrop'
import { ClubLogo } from '../components/ClubLogo'
import { LegalLinks } from '../components/LegalLinks'
import { useAuth } from '../hooks/useAuth'
import { useClub, useClubPath } from '../hooks/useClub'
import { useStaffMember } from '../hooks/useMember'

const TATAMI_URL = (import.meta.env.VITE_TATAMI_URL as string | undefined) || 'https://tatamistudio.net'

export function AdminLayout() {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const { data: club } = useClub()
  const { data: member } = useStaffMember(club?.id)
  const navigate = useNavigate()
  const location = useLocation()
  const outlet = useOutlet()
  const path = useClubPath()

  const tabs = [
    { to: path('/admin'), end: true, label: t('admin.nav.members') },
    { to: path('/admin/attendance'), end: false, label: t('admin.nav.attendance') },
    { to: path('/admin/payments'), end: false, label: t('admin.nav.payments') },
    { to: path('/admin/messages'), end: false, label: t('admin.nav.messages') },
    ...(club?.store_enabled ? [{ to: path('/admin/reservations'), end: false, label: t('admin.nav.reservations') }] : []),
    ...(club?.qr_checkin_enabled ? [{ to: path('/admin/qr'), end: false, label: t('admin.nav.qr') }] : []),
  ]

  return (
    <div className="relative flex min-h-screen flex-col">
      <KanjiBackdrop parallax={0.3} baseAlpha={0.06} />
      <div className="kana-vignette" />

      <header className="sticky top-0 z-20 border-b border-line/60 bg-kuro/95">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-5">
          <Link to={path('/admin')} className="flex min-w-0 items-center gap-2.5">
            <ClubLogo club={club} className="h-9 w-9 text-xs" />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-base font-semibold uppercase tracking-[0.2em] text-ink">{club?.name}</p>
              <p className="truncate text-[10px] uppercase tracking-[0.2em] text-muted">{t('admin.title')}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 font-display text-xs uppercase tracking-wide">
            {member && (
              <span className="hidden rounded-full bg-ai px-3 py-1 text-[11px] text-shiro sm:inline">
                {t(`admin.role.${member.role}`)}
              </span>
            )}
            <Link
              to={path()}
              className="rounded-full px-3 py-2 text-muted transition-colors hover:text-aka-text"
              aria-label={t('admin.backToApp')}
            >
              <span className="sm:hidden">←</span>
              <span className="hidden sm:inline">{t('admin.backToApp')}</span>
            </Link>
            <button
              type="button"
              onClick={async () => {
                // Leave the protected page first; signing out while still on it
                // would make the login send you back here afterwards.
                navigate(path('/login'), { replace: true })
                await signOut()
              }}
              className="rounded-full border border-aka/30 px-3 py-2 text-aka-text transition-colors hover:bg-aka hover:text-shiro"
            >
              {t('profilePage.logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 pt-5">
        <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-ink/10 bg-shiro/95 p-1.5 shadow-[0_14px_30px_-22px_rgba(31,27,22,0.6)]">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className="relative shrink-0 sm:flex-1">
              {({ isActive }) => (
                <span
                  className={`relative flex min-h-10 items-center justify-center rounded-xl px-4 font-display text-xs uppercase tracking-wider transition-colors duration-300 ${
                    isActive ? 'text-shiro' : 'text-muted hover:text-ink'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="admin-tab-pill"
                      className="absolute inset-0 rounded-xl bg-aka shadow-[0_8px_18px_-8px_color-mix(in_srgb,var(--color-aka)_90%,transparent)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{tab.label}</span>
                </span>
              )}
            </NavLink>
          ))}
          {/* The club's Tatami subscription is paid on the Tatami site only. */}
          {member?.role === 'owner' && (
            <a
              href={`${TATAMI_URL}/account`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex min-h-10 shrink-0 items-center justify-center rounded-xl px-4 font-display text-xs uppercase tracking-wider text-muted transition-colors hover:text-ink sm:flex-1"
            >
              {t('admin.nav.subscription')} ↗
            </a>
          )}
        </nav>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
      <LegalLinks className="relative py-8" />
    </div>
  )
}
