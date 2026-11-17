import { motion } from 'framer-motion'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminMembers, useCreateLogin, useSaveStudent, type AdminMember, type StudentFields } from '../../hooks/useAdminMembers'
import { useBelts } from '../../hooks/useBelts'
import { useClub } from '../../hooks/useClub'
import { useGroups } from '../../hooks/useGroups'
import { beltLabel } from '../../lib/belts'
import { egnBirthDate, isValidEgn } from '../../lib/egn'
import { randomPin, usernamePreview } from '../../lib/login'

const fieldClass =
  'mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-kuro px-3 text-ink outline-none transition-colors focus:border-aka-text'
const labelClass = 'block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted'

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? 'sm:col-span-2' : undefined}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

const text = (v: string) => v.trim() || null
const int = (v: string) => (v.trim() ? Math.round(Number(v)) : null)

// Add a student, or edit one. The app login is made at the same time with
// nothing to type: the username is the first name plus the club
// ("maria.spartak") and the password the first 6 digits of the ЕГН. A brother
// or sister can share an existing login instead (one login per family).
export function StudentFormModal({
  clubId,
  member,
  onClose,
}: {
  clubId: string
  member?: AdminMember
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const { data: belts } = useBelts(clubId)
  const { data: groups } = useGroups(clubId)
  const { data: club } = useClub()
  const { data: allMembers } = useAdminMembers(clubId)
  const save = useSaveStudent(clubId)
  const createLogin = useCreateLogin(clubId)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [f, setF] = useState({
    full_name: member?.full_name ?? '',
    egn: member?.egn ?? '',
    birth_year: member?.birth_year ? String(member.birth_year) : '',
    phone: member?.phone ?? '',
    email: member?.email ?? '',
    group_id: member?.group_id ?? '',
    belt_id: member?.belt?.id ?? '',
    fee: member?.monthly_fee_cents != null ? String(member.monthly_fee_cents / 100) : '',
    status: member?.status ?? 'active',
    height_cm: member?.height_cm ? String(member.height_cm) : '',
    weight_kg: member?.weight_kg ? String(member.weight_kg) : '',
    guardian_first_name: member?.guardian_first_name ?? '',
    guardian_last_name: member?.guardian_last_name ?? '',
    guardian_phone: member?.guardian_phone ?? '',
    guardian_email: member?.guardian_email ?? '',
  })
  const canAddLogin = !member?.user_id
  const [withLogin, setWithLogin] = useState(!member)
  const [siblingId, setSiblingId] = useState('')
  const [pin] = useState(randomPin)
  const withEgn = f.egn.length === 10 && isValidEgn(f.egn)
  const password = withEgn ? f.egn.slice(0, 6) : pin
  const siblings = (allMembers ?? []).filter((m) => m.role === 'student' && m.user_id && m.id !== member?.id)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }))

  function onEgn(value: string) {
    const egn = value.replace(/\D/g, '').slice(0, 10)
    const born = egn.length === 10 ? egnBirthDate(egn) : null
    setF((s) => ({ ...s, egn, birth_year: born && !s.birth_year ? String(born.getFullYear()) : s.birth_year }))
  }

  const egnBad = f.egn.length > 0 && !isValidEgn(f.egn)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (egnBad) return setError(t('admin.student.egnInvalid'))
    const fields: StudentFields = {
      full_name: f.full_name.trim(),
      egn: text(f.egn),
      birth_year: int(f.birth_year),
      phone: text(f.phone),
      email: text(f.email),
      group_id: f.group_id || null,
      belt_id: f.belt_id || null,
      monthly_fee_cents: f.fee.trim() ? Math.round(Number(f.fee) * 100) : null,
      status: f.status as AdminMember['status'],
      height_cm: int(f.height_cm),
      weight_kg: int(f.weight_kg),
      guardian_first_name: text(f.guardian_first_name),
      guardian_last_name: text(f.guardian_last_name),
      guardian_phone: text(f.guardian_phone),
      guardian_email: text(f.guardian_email),
    }
    try {
      const id = await save.mutateAsync({ id: member?.id, fields })
      if (withLogin) {
        const res = await createLogin.mutateAsync(siblingId ? { memberId: id, siblingId } : { memberId: id, password })
        setDone(
          res.linked_existing
            ? t('admin.student.linked', { login: res.login })
            : t('admin.student.loginMade', { login: res.login, password, slug: club?.slug }),
        )
        return
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.edit.error'))
    }
  }

  const busy = save.isPending || createLogin.isPending

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center sm:px-6"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-shiro p-6 shadow-2xl sm:rounded-3xl"
      >
        <p className="font-display text-xl font-semibold uppercase tracking-wide text-ink">
          {member ? t('admin.student.editTitle') : t('admin.student.addTitle')}
        </p>

        {done ? (
          <div className="mt-5 space-y-4">
            <p className="whitespace-pre-line rounded-2xl bg-jade/10 p-4 text-sm text-ink">{done}</p>
            <button type="button" onClick={onClose} className="min-h-12 w-full rounded-xl bg-ink font-display text-sm uppercase tracking-wide text-shiro">
              {t('admin.detail.close')}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-6">
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <Field label={t('admin.student.name')} wide>
                <input required maxLength={120} value={f.full_name} onChange={set('full_name')} className={fieldClass} />
              </Field>
              <Field label={t('admin.student.egn')}>
                <input
                  inputMode="numeric"
                  value={f.egn}
                  onChange={(e) => onEgn(e.target.value)}
                  className={`${fieldClass} font-mono tracking-wider ${egnBad ? 'border-aka-text' : ''}`}
                  aria-invalid={egnBad}
                />
                {egnBad && <span className="mt-1 block text-xs text-aka-text">{t('admin.student.egnInvalid')}</span>}
              </Field>
              <Field label={t('admin.student.birthYear')}>
                <input type="number" min={1940} max={new Date().getFullYear()} value={f.birth_year} onChange={set('birth_year')} className={fieldClass} />
              </Field>
              <Field label={t('admin.detail.phone')}>
                <input type="tel" maxLength={40} value={f.phone} onChange={set('phone')} className={fieldClass} />
              </Field>
              <Field label={t('admin.detail.email')}>
                <input type="email" maxLength={200} value={f.email} onChange={set('email')} className={fieldClass} />
              </Field>
            </fieldset>

            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="mb-2 font-display text-sm uppercase tracking-wide text-ink">{t('admin.student.training')}</legend>
              <Field label={t('admin.student.group')}>
                <select value={f.group_id} onChange={set('group_id')} className={fieldClass}>
                  <option value="">-</option>
                  {groups?.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('admin.student.belt')}>
                <select value={f.belt_id} onChange={set('belt_id')} className={fieldClass}>
                  <option value="">-</option>
                  {belts?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {beltLabel(b, i18n.resolvedLanguage)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('admin.student.fee')}>
                <input type="number" min={0} step="0.01" value={f.fee} onChange={set('fee')} className={fieldClass} />
              </Field>
              <Field label={t('admin.student.status')}>
                <select value={f.status} onChange={set('status')} className={fieldClass}>
                  {(['active', 'trial', 'paused', 'left'] as const).map((s) => (
                    <option key={s} value={s}>
                      {t(`admin.status.${s}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('admin.detail.height')}>
                <input type="number" min={50} max={230} value={f.height_cm} onChange={set('height_cm')} className={fieldClass} />
              </Field>
              <Field label={t('admin.detail.weight')}>
                <input type="number" min={10} max={200} value={f.weight_kg} onChange={set('weight_kg')} className={fieldClass} />
              </Field>
            </fieldset>

            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="mb-2 font-display text-sm uppercase tracking-wide text-ink">{t('admin.members.guardian')}</legend>
              <Field label={t('admin.student.firstName')}>
                <input maxLength={80} value={f.guardian_first_name} onChange={set('guardian_first_name')} className={fieldClass} />
              </Field>
              <Field label={t('admin.student.lastName')}>
                <input maxLength={80} value={f.guardian_last_name} onChange={set('guardian_last_name')} className={fieldClass} />
              </Field>
              <Field label={t('admin.detail.phone')}>
                <input type="tel" maxLength={40} value={f.guardian_phone} onChange={set('guardian_phone')} className={fieldClass} />
              </Field>
              <Field label={t('admin.detail.email')}>
                <input type="email" maxLength={200} value={f.guardian_email} onChange={set('guardian_email')} className={fieldClass} />
              </Field>
            </fieldset>

            {canAddLogin && (
              <fieldset className="rounded-2xl border border-ink/10 bg-kuro/60 p-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={withLogin}
                    onChange={(e) => setWithLogin(e.target.checked)}
                    className="h-5 w-5 accent-[var(--color-aka)]"
                  />
                  <span className="font-display text-sm uppercase tracking-wide text-ink">{t('admin.student.makeLogin')}</span>
                </label>
                {withLogin && (
                  <div className="mt-3 space-y-3">
                    {siblings.length > 0 && (
                      <div className="grid grid-cols-2 gap-2" role="radiogroup">
                        {[false, true].map((sib) => {
                          const active = sib === !!siblingId
                          return (
                            <button
                              key={String(sib)}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setSiblingId(sib ? siblings[0].id : '')}
                              className={`min-h-11 rounded-xl px-3 font-display text-xs uppercase tracking-wide transition-colors ${
                                active ? 'bg-ink text-shiro' : 'border border-ink/15 text-muted hover:text-ink'
                              }`}
                            >
                              {t(sib ? 'admin.student.loginSibling' : 'admin.student.loginNew')}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {siblingId ? (
                      <>
                        <Field label={t('admin.student.siblingPick')}>
                          <select value={siblingId} onChange={(e) => setSiblingId(e.target.value)} className={fieldClass}>
                            {siblings.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.full_name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <p className="text-xs text-muted">{t('admin.student.siblingHint')}</p>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3 rounded-xl bg-shiro px-4 py-3">
                          <div className="min-w-0">
                            <p className={labelClass}>{t('admin.student.loginUser')}</p>
                            <p className="truncate font-mono text-base text-ink">{usernamePreview(f.full_name, club?.slug)}</p>
                          </div>
                          <div>
                            <p className={labelClass}>{t('admin.student.password')}</p>
                            <p className="font-mono text-base tracking-wider text-ink">{password}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted">{t(withEgn ? 'admin.student.passFromEgn' : 'admin.student.passRandom')}</p>
                      </>
                    )}
                  </div>
                )}
              </fieldset>
            )}

            {error && <p className="rounded-xl bg-aka/10 px-4 py-3 text-sm text-aka-text">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-ink/15 font-display text-sm uppercase tracking-wide text-muted">
                {t('admin.edit.cancel')}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="min-h-12 rounded-xl bg-aka font-display text-sm uppercase tracking-wide text-shiro shadow-[0_12px_24px_-12px_color-mix(in_srgb,var(--color-aka)_90%,transparent)] disabled:opacity-60"
              >
                {busy ? '...' : t('admin.student.save')}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
