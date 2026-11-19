import { AnimatePresence, motion } from 'framer-motion'
import { useState, type FormEvent, type ReactNode, type UIEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ClubLogo } from '../components/ClubLogo'
import { KanjiBackdrop } from '../components/KanjiBackdrop'
import { TatamiMark } from '../components/TatamiMark'
import { useAuth } from '../hooks/useAuth'
import { useClub, type Club } from '../hooks/useClub'
import { egnBirthDate, isValidEgn } from '../lib/egn'
import { supabase } from '../lib/supabaseClient'

type ClubInfo = Pick<Club, 'id' | 'slug' | 'name' | 'logo_path' | 'accent_color'>

interface Kid {
  full_name: string
  egn: string
}

const field =
  'mt-1 min-h-12 w-full rounded-xl border border-ink/15 bg-kuro px-3 text-base text-ink outline-none transition-colors focus:border-aka-text focus:bg-shiro'
const labelCls = 'block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted'
const primary =
  'min-h-12 w-full rounded-xl bg-aka font-display text-sm uppercase tracking-wide text-shiro shadow-[0_12px_24px_-12px_color-mix(in_srgb,var(--color-aka)_90%,transparent)] transition-transform active:scale-[0.98] disabled:opacity-50'

async function callRegister(body: object) {
  const { data, error } = await supabase.functions.invoke('register-with-code', { body })
  if (error) {
    const ctx = (error as { context?: Response }).context
    const msg = ctx ? ((await ctx.json().catch(() => null)) as { error?: string } | null)?.error : null
    throw new Error(msg ?? error.message)
  }
  return data
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-aka-text">{hint}</span>}
    </label>
  )
}

// Registration with the club's code: code -> who you are -> the students ->
// the terms. "add" mode (from Profile) skips the code and the account and
// just adds another child to the signed-in login.
export function Register({ mode = 'new' }: { mode?: 'new' | 'add' }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const { data: currentClub } = useClub()
  const adding = mode === 'add'

  const [step, setStep] = useState(adding ? 2 : 0)
  const [code, setCode] = useState('')
  const [club, setClub] = useState<ClubInfo | null>(null)
  const [role, setRole] = useState<'parent' | 'student'>('parent')
  const [account, setAccount] = useState({ full_name: '', phone: '', email: '', password: '' })
  const [kids, setKids] = useState<Kid[]>([{ full_name: '', egn: '' }])
  const [readToEnd, setReadToEnd] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const theClub = adding ? currentClub : club
  const steps = adding ? [t('register.stepStudents'), t('register.stepTerms')] : [t('register.stepCode'), t('register.stepYou'), t('register.stepStudents'), t('register.stepTerms')]
  const shownStep = adding ? step - 2 : step

  async function checkCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const data = await callRegister({ check: true, code })
      setClub(data.club)
      setStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.error'))
    } finally {
      setBusy(false)
    }
  }

  function nextFromYou(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (account.password.length < 8) return setError(t('register.passwordShort'))
    if (role === 'student') setKids([{ full_name: account.full_name, egn: kids[0]?.egn ?? '' }])
    setStep(2)
  }

  function nextFromKids(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const egns = kids.map((k) => k.egn)
    if (kids.some((k) => !isValidEgn(k.egn))) return setError(t('register.egnInvalid'))
    if (new Set(egns).size !== egns.length) return setError(t('register.egnTwice'))
    setStep(3)
  }

  async function submit() {
    setError(null)
    setBusy(true)
    try {
      const students = kids.map((k) => ({ full_name: k.full_name.trim(), egn: k.egn }))
      if (adding) {
        await callRegister({ club_id: currentClub?.id, role: 'parent', students, accepted })
        navigate(`/${currentClub?.slug}/profile`, { replace: true })
        window.location.reload()
        return
      }
      const res = await callRegister({ code, role, account: { ...account, email: account.email.trim() }, students, accepted })
      const { error: signInError } = await signIn(account.email.trim(), account.password)
      navigate(signInError ? `/${res.club.slug}/login` : `/${res.club.slug}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.error'))
    } finally {
      setBusy(false)
    }
  }

  const terms = [...(t('privacy.sections', { returnObjects: true, club: theClub?.name ?? '' }) as { title: string; body: string[] }[]),
    ...(t('terms.sections', { returnObjects: true, club: theClub?.name ?? '' }) as { title: string; body: string[] }[])]

  return (
    <div className="relative flex min-h-screen items-start justify-center px-5 py-8 sm:items-center">
      <KanjiBackdrop parallax={0} baseAlpha={0.06} />
      <div className="kana-vignette" />
      <div className="relative w-full max-w-md rounded-3xl border border-ink/10 bg-shiro/95 p-6 shadow-[0_30px_60px_-30px_rgba(31,27,22,0.6)] sm:p-7">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => (step > (adding ? 2 : 0) ? setStep(step - 1) : navigate(-1))} className="text-sm text-muted hover:text-ink">
            ← {t('auth.back')}
          </button>
          {theClub ? <ClubLogo club={theClub as Club} className="h-9 w-9 text-xs" /> : <TatamiMark className="h-9 w-9 text-xl" />}
        </div>

        <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-ink">{t(adding ? 'register.addTitle' : 'register.title')}</h1>
        {theClub && <p className="mt-1 text-sm text-muted">{theClub.name}</p>}

        {/* Progress */}
        <div className="mt-5 flex gap-1.5" aria-label={steps[shownStep]}>
          {steps.map((s, i) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i <= shownStep ? 'bg-aka' : 'bg-ink/10'}`} />
          ))}
        </div>
        <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted">{steps[shownStep]}</p>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
            {step === 0 && (
              <form onSubmit={checkCode} className="mt-5 space-y-4">
                <p className="text-sm text-muted">{t('register.codeHint')}</p>
                <input
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="ABC123"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className={`${field} text-center font-mono text-2xl tracking-[0.5em]`}
                  aria-label={t('register.code')}
                />
                <button type="submit" disabled={busy || code.length !== 6} className={primary}>
                  {busy ? '...' : t('register.next')}
                </button>
              </form>
            )}

            {step === 1 && (
              <form onSubmit={nextFromYou} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-2" role="radiogroup">
                  {(['parent', 'student'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={role === r}
                      onClick={() => setRole(r)}
                      className={`min-h-14 rounded-xl px-3 text-left transition-colors ${role === r ? 'bg-ink text-shiro' : 'border border-ink/15 text-ink'}`}
                    >
                      <span className="block font-display text-sm uppercase tracking-wide">{t(`register.role.${r}`)}</span>
                      <span className={`block text-[11px] ${role === r ? 'text-shiro/70' : 'text-muted'}`}>{t(`register.roleHint.${r}`)}</span>
                    </button>
                  ))}
                </div>
                <Field label={t('register.yourName')}>
                  <input required minLength={3} maxLength={120} autoComplete="name" value={account.full_name} onChange={(e) => setAccount((a) => ({ ...a, full_name: e.target.value }))} className={field} />
                </Field>
                <Field label={t('register.phone')}>
                  <input required type="tel" pattern="\+?[0-9 ()-]{6,20}" autoComplete="tel" value={account.phone} onChange={(e) => setAccount((a) => ({ ...a, phone: e.target.value }))} className={field} />
                </Field>
                <Field label={t('register.email')}>
                  <input required type="email" autoComplete="email" value={account.email} onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))} className={field} />
                </Field>
                <Field label={t('register.password')}>
                  <input required type="password" minLength={8} autoComplete="new-password" value={account.password} onChange={(e) => setAccount((a) => ({ ...a, password: e.target.value }))} className={field} />
                  <span className="mt-1 block text-xs text-muted">{t('register.passwordHint')}</span>
                </Field>
                <button type="submit" className={primary}>{t('register.next')}</button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={nextFromKids} className="mt-5 space-y-4">
                {kids.map((k, i) => {
                  const bad = k.egn.length === 10 && !isValidEgn(k.egn)
                  const born = k.egn.length === 10 && !bad ? egnBirthDate(k.egn) : null
                  return (
                    <motion.div key={i} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 rounded-2xl border border-ink/10 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-display text-sm uppercase tracking-wide text-ink">
                          {role === 'student' && !adding ? t('register.you') : t('register.child', { n: i + 1 })}
                        </p>
                        {kids.length > 1 && (
                          <button type="button" onClick={() => setKids((list) => list.filter((_, j) => j !== i))} className="text-xs text-muted hover:text-aka-text">
                            {t('register.removeChild')}
                          </button>
                        )}
                      </div>
                      <Field label={t('register.studentName')}>
                        <input required minLength={3} maxLength={120} value={k.full_name} onChange={(e) => setKids((list) => list.map((x, j) => (j === i ? { ...x, full_name: e.target.value } : x)))} className={field} />
                      </Field>
                      <Field label={t('register.egn')} hint={bad ? t('register.egnInvalid') : undefined}>
                        <input
                          required
                          inputMode="numeric"
                          value={k.egn}
                          onChange={(e) => setKids((list) => list.map((x, j) => (j === i ? { ...x, egn: e.target.value.replace(/\D/g, '').slice(0, 10) } : x)))}
                          className={`${field} font-mono tracking-wider ${bad ? 'border-aka-text' : ''}`}
                          aria-invalid={bad}
                        />
                        {born && <span className="mt-1 block text-xs text-jade">✓ {born.toLocaleDateString('bg-BG')}</span>}
                      </Field>
                    </motion.div>
                  )
                })}
                {(role === 'parent' || adding) && kids.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setKids((list) => [...list, { full_name: '', egn: '' }])}
                    className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-dashed border-aka/40 font-display text-xs uppercase tracking-wide text-aka-text hover:bg-aka/5"
                  >
                    + {t('register.addChild')}
                  </button>
                )}
                <button type="submit" className={primary}>{t('register.next')}</button>
              </form>
            )}

            {step === 3 && (
              <div className="mt-5 space-y-4">
                <div
                  onScroll={(e: UIEvent<HTMLDivElement>) => {
                    const el = e.currentTarget
                    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 12) setReadToEnd(true)
                  }}
                  className="max-h-72 space-y-4 overflow-y-auto rounded-2xl border border-ink/10 bg-kuro/50 p-4 text-sm leading-relaxed text-muted"
                >
                  {terms.map((s) => (
                    <section key={s.title}>
                      <p className="font-display text-xs uppercase tracking-wide text-ink">{s.title}</p>
                      {s.body.map((p) => (
                        <p key={p} className="mt-1">{p}</p>
                      ))}
                    </section>
                  ))}
                </div>
                {!readToEnd && <p className="text-center text-xs text-muted">↓ {t('register.scrollToEnd')}</p>}
                <label className={`flex items-start gap-3 text-sm text-ink transition-opacity ${readToEnd ? '' : 'pointer-events-none opacity-40'}`}>
                  <input type="checkbox" disabled={!readToEnd} checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-aka)]" />
                  <span>{t(role === 'parent' || adding ? 'register.acceptParent' : 'register.acceptStudent')}</span>
                </label>
                <button type="button" onClick={submit} disabled={!accepted || busy} className={primary}>
                  {busy ? '...' : t(adding ? 'register.addSubmit' : 'register.submit')}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-4 rounded-xl bg-aka/10 px-4 py-3 text-sm text-aka-text">{error}</p>}

        {!adding && (
          <p className="mt-6 text-center text-sm text-muted">
            {t('register.haveAccount')}{' '}
            <Link to="/login" className="text-aka-text hover:underline">
              {t('auth.submit')}
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
