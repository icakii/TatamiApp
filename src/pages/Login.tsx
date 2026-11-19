import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { KanjiBackdrop } from '../components/KanjiBackdrop'
import { ClubLogo } from '../components/ClubLogo'
import { TatamiMark } from '../components/TatamiMark'
import { useClub, useClubSlug } from '../hooks/useClub'
import { LegalLinks } from '../components/LegalLinks'
import { Modal } from '../components/Modal'
import { useAuth } from '../hooks/useAuth'
import { toLoginEmail } from '../lib/login'

export function Login() {
  const { t } = useTranslation()
  const { session, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const slug = useClubSlug()
  const { data: club } = useClub()
  // Back to where the login was asked for (the hall QR check-in, the store),
  // else the club's home, else the club picker.
  const from = (location.state as { from?: string })?.from ?? (slug ? `/${slug}` : '/')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)

  if (session) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signIn(toLoginEmail(email, slug ?? undefined), password)
    setSubmitting(false)
    if (error) {
      setError(t('auth.error'))
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
      <KanjiBackdrop parallax={0} baseAlpha={0.08} />
      <div className="kana-vignette" />
      <button
        type="button"
        // 'default' = /login was the first page loaded (bookmark, typed URL),
        // so there's no in-app history to go back to -- go to the site.
        onClick={() => (location.key === 'default' ? navigate('/') : navigate(-1))}
        className="absolute left-4 top-4 flex min-h-11 items-center gap-2 rounded-xl border border-ink/15 bg-shiro/95 px-4 font-display text-xs uppercase tracking-wide text-ink shadow-sm transition-colors hover:border-aka-text hover:text-aka-text active:scale-95"
      >
        <span aria-hidden="true">←</span>
        {t('auth.back')}
      </button>
      <div className="reveal-up w-full max-w-sm rounded-3xl border border-ink/10 bg-shiro/95 p-7 shadow-[0_30px_60px_-30px_rgba(31,27,22,0.6)]">
        <div className="mx-auto flex w-fit flex-col items-center">
          {slug ? <ClubLogo club={club} className="h-20 w-20 text-2xl" /> : <TatamiMark className="h-16 w-16 text-4xl" />}
          <p className="mt-3 font-display text-sm uppercase tracking-[0.3em] text-muted">{slug ? club?.name : 'Tatami'}</p>
        </div>
        <h1 className="mt-4 text-center font-display text-2xl font-bold uppercase tracking-wide">
          {t('auth.title')}
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-muted">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username"
              placeholder={slug ? `maria.${slug}` : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-line bg-kuro px-3 text-ink outline-none transition-colors focus:border-aka-text focus:bg-shiro"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-muted">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-line bg-kuro px-3 text-ink outline-none transition-colors focus:border-aka-text focus:bg-shiro"
            />
          </div>

          {error && <p className="text-sm text-aka-text">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="min-h-12 w-full rounded-xl bg-aka font-display text-sm uppercase tracking-wide text-shiro shadow-[0_12px_24px_-12px_color-mix(in_srgb,var(--color-aka)_90%,transparent)] transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? t('auth.submitting') : t('auth.submit')}
          </button>
        </form>

        <Link
          to="/forgot-password"
          className="mt-4 block text-center text-sm text-muted hover:text-aka-text"
        >
          {t('auth.forgotLink')}
        </Link>

        <p className="mt-6 text-center text-sm text-muted">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-aka-text hover:underline">
            {t('auth.registerLink')}
          </Link>
        </p>

        <LegalLinks className="mt-8" />
      </div>

      {showContactModal && (
        <Modal
          title={t('auth.modalTitle')}
          closeLabel={t('auth.modalClose')}
          onClose={() => setShowContactModal(false)}
        >
          {t('auth.modalBody')}
        </Modal>
      )}
    </div>
  )
}
