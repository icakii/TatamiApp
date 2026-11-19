import { AnimatePresence, motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Pill } from '../../components/admin/ui'
import { PageHeader } from '../../components/app/ui'
import { useClub } from '../../hooks/useClub'
import {
  DEFAULT_DISCIPLINES,
  useCompetitionEntries,
  useCompetitions,
  useDeleteCompetition,
  useRemoveEntry,
  useSaveCompetition,
  type Competition,
} from '../../hooks/useCompetitions'
import { localISODate, shortMonth } from '../../lib/date'

const field = 'mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-kuro px-3 text-ink outline-none focus:border-aka-text'
const labelCls = 'block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted'

// The coach runs competitions here: add or edit (date, time, place, notes,
// disciplines), open sign-ups, and see who signed up in which discipline.
export function AdminCompetitions() {
  const { t } = useTranslation()
  const { data: club } = useClub()
  const { data: competitions } = useCompetitions(club?.id)
  const [editing, setEditing] = useState<Competition | 'new' | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const today = localISODate()
  const upcoming = (competitions ?? []).filter((c) => c.event_date >= today).sort((a, b) => (a.event_date < b.event_date ? -1 : 1))
  const past = (competitions ?? []).filter((c) => c.event_date < today)

  return (
    <div className="px-5 py-6">
      <PageHeader kanji="勝" title={t('admin.comp.title')}>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="min-h-11 rounded-full bg-aka px-5 font-display text-xs uppercase tracking-wide text-shiro shadow-[0_12px_24px_-12px_color-mix(in_srgb,var(--color-aka)_90%,transparent)]"
        >
          + {t('admin.comp.add')}
        </button>
      </PageHeader>
      <p className="mt-2 text-sm text-muted">{t('admin.comp.body')}</p>

      <div className="mt-5 space-y-3">
        {upcoming.length === 0 && <p className="rounded-2xl border border-dashed border-ink/15 p-6 text-center text-sm text-muted">{t('admin.comp.none')}</p>}
        {upcoming.map((c) => (
          <CompetitionRow key={c.id} c={c} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} onEdit={() => setEditing(c)} />
        ))}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-sm uppercase tracking-[0.2em] text-muted">{t('admin.comp.past')}</h2>
          <div className="mt-3 space-y-3 opacity-80">
            {past.map((c) => (
              <CompetitionRow key={c.id} c={c} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} onEdit={() => setEditing(c)} />
            ))}
          </div>
        </>
      )}

      <AnimatePresence>{editing && <CompetitionForm clubId={club?.id} competition={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}</AnimatePresence>
    </div>
  )
}

function CompetitionRow({ c, open, onToggle, onEdit }: { c: Competition; open: boolean; onToggle: () => void; onEdit: () => void }) {
  const { t, i18n } = useTranslation()
  const { data: club } = useClub()
  const { data: entries } = useCompetitionEntries(club?.id, open ? c.id : null)
  const save = useSaveCompetition(club?.id)
  const removeEntry = useRemoveEntry(club?.id)
  const date = new Date(`${c.event_date}T00:00:00`).toLocaleDateString(i18n.resolvedLanguage, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  const byDiscipline = c.disciplines.map((d) => ({ d, list: (entries ?? []).filter((e) => e.category === d) }))
  const upcoming = c.event_date >= localISODate()

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-shiro/95 shadow-[0_16px_32px_-24px_rgba(31,27,22,0.55)]">
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-4 p-4 text-left" aria-expanded={open}>
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-ai text-shiro">
          <span className="font-display text-xl font-bold leading-none">{new Date(`${c.event_date}T00:00:00`).getDate()}</span>
          <span className="text-[9px] uppercase tracking-wider text-shiro/70">
            {shortMonth(c.event_date, i18n.resolvedLanguage)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg uppercase tracking-wide text-ink">{c.name}</p>
          <p className="text-xs text-muted">
            {date}
            {c.start_time && ` · ${c.start_time.slice(0, 5)}`}
            {c.location && ` · ${c.location}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {upcoming && <Pill tone={c.registration_open ? 'jade' : 'muted'}>{t(c.registration_open ? 'admin.comp.open' : 'admin.comp.closed')}</Pill>}
          </div>
        </div>
        <span className={`mt-1 text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="space-y-4 border-t border-ink/10 p-4">
              {c.notes && <p className="whitespace-pre-line rounded-xl bg-kuro/60 p-3 text-sm text-ink">{c.notes}</p>}
              <div className="flex flex-wrap gap-2">
                {upcoming && (
                  <button
                    type="button"
                    onClick={() => save.mutate({ id: c.id, fields: { ...c, registration_open: !c.registration_open } })}
                    className={`min-h-10 rounded-xl px-4 font-display text-xs uppercase tracking-wide ${c.registration_open ? 'border border-ink/15 text-ink' : 'bg-jade text-shiro'}`}
                  >
                    {t(c.registration_open ? 'admin.comp.closeSignups' : 'admin.comp.openSignups')}
                  </button>
                )}
                <button type="button" onClick={onEdit} className="min-h-10 rounded-xl border border-ink/15 px-4 font-display text-xs uppercase tracking-wide text-ink">
                  {t('admin.comp.edit')}
                </button>
              </div>

              <div>
                <p className={labelCls}>{t('admin.comp.signedUp', { count: entries?.length ?? 0 })}</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {byDiscipline.map(({ d, list }) => (
                    <div key={d} className="rounded-xl border border-ink/10 p-3">
                      <p className="flex items-center justify-between font-display text-sm uppercase tracking-wide text-ink">
                        {d}
                        <span className="text-xs text-muted">{list.length}</span>
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {list.length === 0 && <li className="text-xs text-muted-2">-</li>}
                        {list.map((e) => (
                          <li key={e.id} className="group flex items-center justify-between gap-2 text-sm">
                            <span className="min-w-0 truncate text-ink">
                              {e.member?.full_name}
                              <span className="text-xs text-muted">
                                {e.member?.birth_year ? ` · ${new Date().getFullYear() - e.member.birth_year} ${t('admin.comp.years')}` : ''}
                                {e.member?.belt ? ` · ${e.member.belt.grade_bg ?? e.member.belt.name_bg}` : ''}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => window.confirm(t('admin.comp.removeConfirm', { name: e.member?.full_name ?? '' })) && removeEntry.mutate(e.id)}
                              className="shrink-0 text-xs text-muted opacity-60 hover:text-aka-text group-hover:opacity-100"
                              aria-label={t('admin.comp.remove')}
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CompetitionForm({ clubId, competition, onClose }: { clubId: string | undefined; competition: Competition | null; onClose: () => void }) {
  const { t } = useTranslation()
  const save = useSaveCompetition(clubId)
  const remove = useDeleteCompetition(clubId)
  const [f, setF] = useState({
    name: competition?.name ?? '',
    event_date: competition?.event_date ?? '',
    start_time: competition?.start_time?.slice(0, 5) ?? '',
    location: competition?.location ?? '',
    notes: competition?.notes ?? '',
    registration_open: competition?.registration_open ?? true,
  })
  const [disciplines, setDisciplines] = useState<string[]>(competition?.disciplines ?? DEFAULT_DISCIPLINES)
  const [newDiscipline, setNewDiscipline] = useState('')
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (disciplines.length === 0) return
    await save.mutateAsync({
      id: competition?.id,
      fields: {
        name: f.name.trim(),
        event_date: f.event_date,
        start_time: f.start_time || null,
        location: f.location.trim() || null,
        notes: f.notes.trim() || null,
        disciplines,
        registration_open: f.registration_open,
      },
    })
    onClose()
  }

  function addDiscipline() {
    const d = newDiscipline.trim()
    if (d && !disciplines.includes(d) && disciplines.length < 12) setDisciplines((list) => [...list, d])
    setNewDiscipline('')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center sm:px-6" onClick={onClose}>
      <motion.form
        role="dialog"
        aria-modal="true"
        onSubmit={onSubmit}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-3xl bg-shiro p-6 shadow-2xl sm:rounded-3xl"
      >
        <p className="font-display text-xl font-semibold uppercase tracking-wide text-ink">{t(competition ? 'admin.comp.editTitle' : 'admin.comp.addTitle')}</p>
        <label className="block">
          <span className={labelCls}>{t('competitions.name')}</span>
          <input required maxLength={120} value={f.name} onChange={set('name')} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelCls}>{t('competitions.date')}</span>
            <input required type="date" value={f.event_date} onChange={set('event_date')} className={field} />
          </label>
          <label className="block">
            <span className={labelCls}>{t('admin.comp.time')}</span>
            <input type="time" value={f.start_time} onChange={set('start_time')} className={field} />
          </label>
        </div>
        <label className="block">
          <span className={labelCls}>{t('competitions.place')}</span>
          <input maxLength={160} value={f.location} onChange={set('location')} placeholder={t('admin.comp.placeHint')} className={field} />
        </label>
        <label className="block">
          <span className={labelCls}>{t('admin.comp.notes')}</span>
          <textarea rows={3} maxLength={2000} value={f.notes} onChange={set('notes')} placeholder={t('admin.comp.notesHint')} className={`${field} py-2.5`} />
        </label>

        <div>
          <span className={labelCls}>{t('admin.comp.disciplines')}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {disciplines.map((d) => (
              <span key={d} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs text-shiro">
                {d}
                <button type="button" onClick={() => setDisciplines((list) => list.filter((x) => x !== d))} className="text-shiro/60 hover:text-shiro" aria-label={t('admin.comp.remove')}>
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={newDiscipline}
              maxLength={40}
              onChange={(e) => setNewDiscipline(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addDiscipline()
                }
              }}
              placeholder={t('admin.comp.addDiscipline')}
              className={`${field} mt-0`}
            />
            <button type="button" onClick={addDiscipline} className="shrink-0 rounded-xl border border-ink/15 px-4 text-sm text-ink">
              +
            </button>
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-ink">
          <input type="checkbox" checked={f.registration_open} onChange={(e) => setF((s) => ({ ...s, registration_open: e.target.checked }))} className="h-5 w-5 accent-[var(--color-aka)]" />
          {t('admin.comp.openNow')}
        </label>

        {save.error && <p className="text-sm text-aka-text">{t('competitions.error')}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-ink/15 font-display text-sm uppercase tracking-wide text-muted">
            {t('admin.edit.cancel')}
          </button>
          <button type="submit" disabled={save.isPending || disciplines.length === 0} className="min-h-12 rounded-xl bg-aka font-display text-sm uppercase tracking-wide text-shiro disabled:opacity-60">
            {save.isPending ? '...' : t('competitions.save')}
          </button>
        </div>
        {competition && (
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm(t('admin.comp.deleteConfirm'))) return
              await remove.mutateAsync(competition.id)
              onClose()
            }}
            className="w-full text-center text-xs uppercase tracking-wide text-muted hover:text-aka-text"
          >
            {t('admin.comp.delete')}
          </button>
        )}
      </motion.form>
    </motion.div>
  )
}
