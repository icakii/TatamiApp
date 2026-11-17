import { AnimatePresence, motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'

// Children's first password is the start of their ЕГН, so parents are
// nudged to set their own here. Usernames have no mailbox, so this is also
// the only way to change it without the coach.
export function ChangePasswordCard() {
  const { t } = useTranslation()
  const { updatePassword } = useAuth()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await updatePassword(password)
    setBusy(false)
    if (error) return setMsg({ ok: false, text: t('profilePage.passwordError') })
    setPassword('')
    setOpen(false)
    setMsg({ ok: true, text: t('profilePage.passwordSaved') })
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-shiro/95 p-1">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o)
          setMsg(null)
        }}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl font-display text-sm uppercase tracking-wide text-ink"
      >
        {t('profilePage.changePassword')}
        <span aria-hidden="true" className={`text-xs text-muted transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            onSubmit={onSubmit}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 p-2">
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder={t('profilePage.newPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-ink/15 bg-kuro px-3 text-ink outline-none focus:border-aka-text"
              />
              <button
                type="submit"
                disabled={busy}
                className="shrink-0 rounded-xl bg-ink px-4 font-display text-xs uppercase tracking-wide text-shiro disabled:opacity-60"
              >
                {busy ? '...' : t('profilePage.savePassword')}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      {msg && <p className={`px-3 pb-2 text-center text-xs ${msg.ok ? 'text-jade' : 'text-aka-text'}`}>{msg.text}</p>}
    </div>
  )
}
