import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation, useOutlet } from 'react-router-dom'
import { CalendarIcon, HomeIcon, TrophyIcon, UserIcon, WalletIcon } from '../components/app/TabIcons'
import { KanjiBackdrop } from '../components/KanjiBackdrop'
import { ClubLogo } from '../components/ClubLogo'
import { useClub, useClubPath } from '../hooks/useClub'
import { OfflineBanner } from '../components/OfflineBanner'
import { ChildSwitcher } from '../components/app/ChildSwitcher'

const TABS: { to: string; end: boolean; key: string; icon: ReactNode }[] = [
  { to: '', end: true, key: 'home', icon: <HomeIcon /> },
  { to: '/schedule', end: false, key: 'schedule', icon: <CalendarIcon /> },
  { to: '/competitions', end: false, key: 'competitions', icon: <TrophyIcon /> },
  { to: '/payments', end: false, key: 'payments', icon: <WalletIcon /> },
  { to: '/profile', end: false, key: 'profile', icon: <UserIcon /> },
]

export function AppLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const outlet = useOutlet()
  const path = useClubPath()
  const { data: club } = useClub()

  return (
    <div className="relative flex min-h-screen flex-col pb-28">
      <KanjiBackdrop parallax={0.3} baseAlpha={0.07} />
      <div className="kana-vignette" />
      <OfflineBanner />

      <header className="sticky top-0 z-20 border-b border-line/60 bg-kuro/95">
        <div className="mx-auto flex h-14 w-full max-w-md items-center gap-2 px-6">
          <ClubLogo club={club} className="h-8 w-8 text-xs" />
          <span className="truncate font-display text-base font-semibold uppercase tracking-[0.2em] text-ink">
            {club?.name}
          </span>
        </div>
      </header>
      <ChildSwitcher />

      {/* Capped width: this is a phone app, not a desktop dashboard. */}
      <main className="mx-auto w-full max-w-md flex-1">
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

      {/* Floating tab bar; the active tab's pill slides between tabs via a
          shared layoutId rather than jumping. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <div className="mx-auto flex max-w-md items-stretch rounded-2xl border border-ink/10 bg-shiro/95 p-1.5 shadow-[0_18px_40px_-16px_rgba(31,27,22,0.45)]">
          {TABS.map((tab) => (
            <NavLink key={tab.key} to={path(tab.to)} end={tab.end} className="relative flex-1">
              {({ isActive }) => (
                <span
                  className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 font-display text-[10px] uppercase tracking-wide transition-colors duration-300 ${
                    isActive ? 'text-shiro' : 'text-muted'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-xl bg-aka shadow-[0_8px_18px_-8px_color-mix(in_srgb,var(--color-aka)_90%,transparent)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{tab.icon}</span>
                  <span className="relative">{t(`tabs.${tab.key}`)}</span>
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
