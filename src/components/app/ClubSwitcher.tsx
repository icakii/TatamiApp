import { motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getDefaultClub, setDefaultClub, useClubSlug, useMyClubs } from '../../hooks/useClub'
import { ClubLogo } from '../ClubLogo'

// For people in more than one club (e.g. a parent with kids in two): switch
// club, and choose which one the app opens by default. Memberships are added
// from the Hub; with a single club this card doesn't show.
export function ClubSwitcher() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { data: mine } = useMyClubs(session?.user.id)
  const current = useClubSlug()
  const navigate = useNavigate()
  const [preferred, setPreferred] = useState(() => getDefaultClub() ?? current)

  if (!mine || mine.length < 2) return null

  return (
    <div className="rounded-3xl border border-ink/10 bg-shiro/95 p-5 shadow-[0_16px_32px_-24px_rgba(31,27,22,0.55)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{t('club.myClubs')}</p>
      <div className="mt-3 space-y-2">
        {mine.map((m) => {
          const isCurrent = m.club.slug === current
          const isDefault = m.club.slug === preferred
          return (
            <div key={m.club.id} className="relative flex items-center gap-3 rounded-2xl p-2.5">
              {isCurrent && (
                <motion.span
                  layoutId="club-current"
                  className="absolute inset-0 rounded-2xl bg-kuro ring-1 ring-aka/30"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <button
                type="button"
                onClick={() => navigate(`/${m.club.slug}/profile`)}
                className="relative flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <ClubLogo club={m.club} className="h-10 w-10 text-sm" />
                <span className="min-w-0">
                  <span className="block truncate font-display uppercase tracking-wide text-ink">{m.club.name}</span>
                  <span className="text-[11px] uppercase tracking-[0.15em] text-muted">{t(`admin.role.${m.role}`)}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDefaultClub(m.club.slug)
                  setPreferred(m.club.slug)
                }}
                aria-pressed={isDefault}
                className={`relative shrink-0 rounded-full px-3 py-1.5 font-display text-[10px] uppercase tracking-wide transition-colors ${
                  isDefault ? 'text-shiro' : 'border border-ink/15 text-muted hover:text-ink'
                }`}
              >
                {isDefault && (
                  <motion.span
                    layoutId="club-default"
                    className="absolute inset-0 rounded-full bg-aka"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                )}
                <span className="relative">{isDefault ? `★ ${t('club.default')}` : t('club.makeDefault')}</span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
