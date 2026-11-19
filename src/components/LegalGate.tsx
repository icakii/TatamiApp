import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useClub, useClubPath } from '../hooks/useClub'
import { supabase } from '../lib/supabaseClient'
import { ClubLogo } from './ClubLogo'
import { KanjiBackdrop } from './KanjiBackdrop'

// Bump when the privacy policy or terms change in substance: everyone is
// asked to confirm the new version on their next visit.
export const LEGAL_VERSION = '2026-11-19'

// GDPR: the first time someone opens a club's app they confirm they've read
// its privacy policy and terms, and that they're the child's parent or
// guardian (or a student of 14+). Stored in legal_acceptances.
export function LegalGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { session, signOut } = useAuth()
  const { data: club } = useClub()
  const path = useClubPath()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = session?.user.id
  const key = ['legal-accepted', club?.id, userId, LEGAL_VERSION]
  const [read, setRead] = useState(false)
  const [guardian, setGuardian] = useState(false)

  const accepted = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_acceptances')
        .select('version')
        .eq('club_id', club!.id)
        .eq('user_id', userId!)
        .eq('version', LEGAL_VERSION)
        .maybeSingle()
      if (error) throw error
      return !!data
    },
    enabled: !!club?.id && !!userId,
    staleTime: Infinity,
  })

  const accept = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('legal_acceptances')
        .upsert({ club_id: club!.id, version: LEGAL_VERSION, as_guardian: guardian, club_terms_at: club!.member_terms_updated_at }, { ignoreDuplicates: true })
      if (error) throw error
    },
    onSuccess: () => queryClient.setQueryData(key, true),
  })

  if (accepted.data) return <>{children}</>
  // While checking (or if the check fails offline) don't flash the screen.
  if (accepted.isLoading || accepted.isError) {
    return accepted.isError ? <>{children}</> : <div className="flex min-h-screen items-center justify-center text-muted">...</div>
  }

  const box = 'mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-aka)]'

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
      <KanjiBackdrop parallax={0} baseAlpha={0.08} />
      <div className="kana-vignette" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-3xl border border-ink/10 bg-shiro/95 p-7 shadow-[0_30px_60px_-30px_rgba(31,27,22,0.6)]"
      >
        <ClubLogo club={club} className="mx-auto h-16 w-16 text-xl" />
        <h1 className="mt-4 text-center font-display text-2xl font-bold uppercase tracking-wide text-ink">{t('legalAccept.title')}</h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-muted">{t('legalAccept.body', { club: club?.name ?? '' })}</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {(['rules', 'privacy', 'terms'] as const).map((doc) => (
            <Link
              key={doc}
              to={path(`/${doc}`)}
              className="flex min-h-11 items-center justify-center rounded-xl border border-ink/15 px-1.5 text-center font-display text-[10px] uppercase tracking-wide text-ink transition-colors hover:border-aka-text hover:text-aka-text"
            >
              {doc === 'rules' ? t('clubRules.short') : t(`footer.${doc}`)} ↗
            </Link>
          ))}
        </div>

        <div className="mt-5 space-y-3 text-sm text-ink">
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} className={box} />
            <span>{t('legalAccept.readBoth')}</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={guardian} onChange={(e) => setGuardian(e.target.checked)} className={box} />
            <span>{t('legalAccept.guardian')}</span>
          </label>
        </div>

        {accept.isError && <p className="mt-4 text-sm text-aka-text">{t('legalAccept.error')}</p>}

        <button
          type="button"
          disabled={!read || !guardian || accept.isPending}
          onClick={() => accept.mutate()}
          className="mt-6 min-h-12 w-full rounded-xl bg-aka font-display text-sm uppercase tracking-wide text-shiro shadow-[0_12px_24px_-12px_color-mix(in_srgb,var(--color-aka)_90%,transparent)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          {accept.isPending ? '...' : t('legalAccept.continue')}
        </button>
        <button
          type="button"
          onClick={async () => {
            navigate(path('/login'), { replace: true })
            await signOut()
          }}
          className="mt-3 w-full text-center text-sm text-muted hover:text-aka-text"
        >
          {t('legalAccept.logout')}
        </button>
      </motion.div>
    </div>
  )
}
