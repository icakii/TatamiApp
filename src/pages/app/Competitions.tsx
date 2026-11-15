import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Eyebrow, PageHeader, Stagger, StaggerItem } from '../../components/app/ui'
import { useClub } from '../../hooks/useClub'
import { useCompetitions, useDeleteCompetition, useMyCompetitionEntries, useSaveCompetition } from '../../hooks/useCompetitions'
import { useMember, useStaffMember } from '../../hooks/useMember'
import { localISODate } from '../../lib/date'

const MEDAL_EMOJI: Record<string, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' }
const MEDAL_CARD: Record<string, string> = {
  gold: 'bg-linear-to-br from-kin to-gold text-shiro',
  silver: 'bg-linear-to-br from-[#c9c6bd] to-[#8d8a82] text-shiro',
  bronze: 'bg-linear-to-br from-[#c98a5a] to-[#7a4a2b] text-shiro',
}

// Counts up from 0 on mount -- small, but it makes the tally feel earned.
function CountUp({ value }: { value: number }) {
  const mv = useMotionValue(0)
  const rounded = useTransform(mv, (v) => Math.round(v))
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 })
    return () => controls.stop()
  }, [mv, value])
  return <motion.span>{rounded}</motion.span>
}

export function Competitions() {
  const { t, i18n } = useTranslation()
  const { data: club } = useClub()
  const { data: member } = useMember(club?.id)
  const { data: competitions } = useCompetitions(club?.id)
  const { data: myEntries } = useMyCompetitionEntries(club?.id, member?.id)
  const { data: staff } = useStaffMember(club?.id)
  const remove = useDeleteCompetition(club?.id)

  const todayISO = localISODate()
  const upcoming = (competitions ?? [])
    .filter((c) => c.event_date >= todayISO)
    .sort((a, b) => (a.event_date < b.event_date ? -1 : 1))
  const myUpcomingIds = new Set(
    (myEntries ?? []).filter((e) => e.competition.event_date >= todayISO).map((e) => e.competition_id),
  )
  const pastResults = (myEntries ?? [])
    .filter((e) => e.competition.event_date < todayISO)
    .sort((a, b) => (a.competition.event_date < b.competition.event_date ? 1 : -1))
  const tally = {
    gold: pastResults.filter((e) => e.medal === 'gold').length,
    silver: pastResults.filter((e) => e.medal === 'silver').length,
    bronze: pastResults.filter((e) => e.medal === 'bronze').length,
  }

  function dateParts(iso: string) {
    const d = new Date(`${iso}T00:00:00`)
    return {
      day: d.getDate(),
      month: d.toLocaleDateString(i18n.resolvedLanguage, { month: 'short' }),
      full: d.toLocaleDateString(i18n.resolvedLanguage, { day: 'numeric', month: 'long', year: 'numeric' }),
    }
  }

  return (
    <div className="px-5 pb-6 pt-5">
      <PageHeader kanji="勝" title={t('competitions.title')} tone="bg-kin" />

      <Stagger className="mt-5 space-y-4">
        <StaggerItem>
          <div className="relative overflow-hidden rounded-3xl bg-ink p-5 text-shiro shadow-[0_24px_48px_-24px_rgba(31,27,22,0.8)]">
            <span
              className="pointer-events-none absolute -right-3 -top-6 font-brush text-[7rem] leading-none text-shiro/5"
              aria-hidden="true"
            >
              勝
            </span>
            <div className="relative grid grid-cols-3 text-center">
              {(['gold', 'silver', 'bronze'] as const).map((m) => (
                <div key={m}>
                  <p className="text-2xl">{MEDAL_EMOJI[m]}</p>
                  <p
                    className={`mt-1 font-display text-3xl font-bold ${
                      m === 'gold' ? 'text-kin' : m === 'silver' ? 'text-shiro/90' : 'text-sakura'
                    }`}
                  >
                    <CountUp value={tally[m]} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <Eyebrow className="px-1 pt-2">{t('competitions.upcoming')}</Eyebrow>
        </StaggerItem>
        {staff && (
          <StaggerItem>
            <AddCompetition clubId={club?.id} />
          </StaggerItem>
        )}
        {upcoming.length === 0 ? (
          <StaggerItem>
            <Card>
              <p className="text-sm text-muted">{t('competitions.noUpcoming')}</p>
            </Card>
          </StaggerItem>
        ) : (
          upcoming.map((c) => {
            const d = dateParts(c.event_date)
            const entered = myUpcomingIds.has(c.id)
            return (
              <StaggerItem key={c.id}>
                <Card className={`flex items-center gap-4 ${entered ? 'border-aka/40' : ''}`}>
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-ai text-shiro">
                    <span className="font-display text-xl font-bold leading-none">{d.day}</span>
                    <span className="text-[9px] uppercase tracking-wider text-shiro/70">{d.month}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-semibold uppercase tracking-wide text-ink">
                      {c.name}
                    </p>
                    {c.location && <p className="truncate text-xs text-muted">{c.location}</p>}
                  </div>
                  {entered && <span className="text-lg">🏆</span>}
                  {staff && (
                    <button
                      type="button"
                      onClick={() => remove.mutate(c.id)}
                      className="shrink-0 rounded-full px-2 py-1 text-xs text-muted hover:text-aka-text"
                      aria-label={t('competitions.delete')}
                    >
                      ✕
                    </button>
                  )}
                </Card>
              </StaggerItem>
            )
          })
        )}

        <StaggerItem>
          <Eyebrow className="px-1 pt-2">{t('competitions.myResults')}</Eyebrow>
        </StaggerItem>
        {pastResults.length === 0 ? (
          <StaggerItem>
            <Card>
              <p className="text-sm text-muted">{t('competitions.noResults')}</p>
            </Card>
          </StaggerItem>
        ) : (
          pastResults.map((entry) => (
            <StaggerItem key={entry.id}>
              <div
                className={`rounded-2xl p-4 shadow-[0_16px_32px_-24px_rgba(31,27,22,0.55)] ${
                  entry.medal ? MEDAL_CARD[entry.medal] : 'border border-ink/10 bg-shiro/95 text-ink'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-semibold uppercase tracking-wide">
                    {entry.competition.name}
                  </p>
                  {entry.medal && <span className="text-2xl">{MEDAL_EMOJI[entry.medal]}</span>}
                </div>
                <p className={`text-xs ${entry.medal ? 'text-shiro/80' : 'text-muted'}`}>
                  {dateParts(entry.competition.event_date).full}
                  {entry.category ? ` — ${entry.category}` : ''}
                </p>
                {entry.placement && (
                  <p
                    className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      entry.medal ? 'bg-shiro/20' : 'bg-aka/10 text-aka-text'
                    }`}
                  >
                    {entry.placement}
                  </p>
                )}
              </div>
            </StaggerItem>
          ))
        )}
      </Stagger>
    </div>
  )
}

// Coaches put the next tournament in themselves; it shows to every student.
function AddCompetition({ clubId }: { clubId: string | undefined }) {
  const { t } = useTranslation()
  const save = useSaveCompetition(clubId)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', event_date: '', location: '' })
  const field = 'mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-kuro px-3 text-ink outline-none focus:border-aka-text'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await save.mutateAsync({ name: form.name.trim(), event_date: form.event_date, location: form.location.trim() || null, notes: null })
    setForm({ name: '', event_date: '', location: '' })
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-aka/40 font-display text-xs uppercase tracking-wide text-aka-text transition-colors hover:bg-aka/5"
      >
        + {t('competitions.add')}
      </button>
    )
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-ink/10 bg-shiro/95 p-4">
      <label className="block">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{t('competitions.name')}</span>
        <input required maxLength={120} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={field} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{t('competitions.date')}</span>
          <input required type="date" min={localISODate()} value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} className={field} />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{t('competitions.place')}</span>
          <input maxLength={120} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className={field} />
        </label>
      </div>
      {save.error && <p className="text-sm text-aka-text">{t('competitions.error')}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-xl border border-ink/15 font-display text-xs uppercase tracking-wide text-muted">
          {t('admin.edit.cancel')}
        </button>
        <button type="submit" disabled={save.isPending} className="min-h-11 rounded-xl bg-aka font-display text-xs uppercase tracking-wide text-shiro disabled:opacity-60">
          {save.isPending ? '...' : t('competitions.save')}
        </button>
      </div>
    </form>
  )
}
