import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useClub, useClubSlug, useMyClubs } from '../hooks/useClub'
import { useMember } from '../hooks/useMember'
import { ClubLogo } from './ClubLogo'
import { LegalGate } from './LegalGate'

// Signed in, or off to the login (the club's own, branded one when inside a
// club), coming back here afterwards.
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()
  const slug = useClubSlug()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted">...</div>
  }
  if (!session) {
    return <Navigate to={slug ? `/${slug}/login` : '/login'} state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}

// Signed in but not part of this club: nothing of the club is shown (RLS
// returns nothing anyway); offer the clubs this person does belong to.
export function MemberGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { data: club } = useClub()
  const { data: member, isLoading } = useMember(club?.id)
  const { data: mine } = useMyClubs(session?.user.id)

  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-muted">...</div>
  if (member) return <LegalGate>{children}</LegalGate>

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <ClubLogo club={club} className="h-16 w-16 text-xl" />
      <p className="mt-6 font-display text-2xl uppercase tracking-wide text-ink">{t('club.noAccessTitle')}</p>
      <p className="mt-2 max-w-sm text-muted">{t('club.noAccessBody', { club: club?.name ?? '' })}</p>
      {!!mine?.length && (
        <div className="mt-8 w-full max-w-sm space-y-2">
          {mine.map((m) => (
            <Link
              key={m.club.id}
              to={`/${m.club.slug}`}
              className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-shiro/95 p-3 text-left transition-colors hover:border-aka-text"
            >
              <ClubLogo club={m.club} className="h-10 w-10 text-sm" />
              <span className="font-display uppercase tracking-wide text-ink">{m.club.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
