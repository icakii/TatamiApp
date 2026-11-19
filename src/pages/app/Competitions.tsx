import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, Eyebrow, PageHeader, Stagger, StaggerItem } from '../../components/app/ui'
import { useClub, useClubPath } from '../../hooks/useClub'
import { useCompetitions, useMyCompetitionEntries, useRemoveEntry, useSignUp, type Competition, type MyCompetitionEntry } from '../../hooks/useCompetitions'
import { useMember, useStaffMember } from '../../hooks/useMember'
import { localISODate, shortMonth } from '../../lib/date'

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
  const path = useClubPath()

  const todayISO = localISODate()
  const upcoming = (competitions ?? [])
    .filter((c) => c.event_date >= todayISO)
    .sort((a, b) => (a.event_date < b.event_date ? -1 : 1))
  const myEntryFor = (id: string) => (myEntries ?? []).find((e) => e.competition_id === id)
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
      month: shortMonth(iso, i18n.resolvedLanguage),
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
            <Link
              to={path('/admin/competitions')}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-aka/40 font-display text-xs uppercase tracking-wide text-aka-text transition-colors hover:bg-aka/5"
            >
              {t('competitions.manage')} →
            </Link>
          </StaggerItem>
        )}
        {upcoming.length === 0 ? (
          <StaggerItem>
            <Card>
              <p className="text-sm text-muted">{t('competitions.noUpcoming')}</p>
            </Card>
          </StaggerItem>
        ) : (
          upcoming.map((c) => (
            <StaggerItem key={c.id}>
              <UpcomingCard c={c} entry={myEntryFor(c.id)} memberId={member?.id} clubId={club?.id} date={dateParts(c.event_date)} />
            </StaggerItem>
          ))
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

// An upcoming competition: when, where, the coach's notes and, while the
// coach has sign-ups open, a one-tap sign-up in one discipline.
function UpcomingCard({
  c,
  entry,
  memberId,
  clubId,
  date,
}: {
  c: Competition
  entry: MyCompetitionEntry | undefined
  memberId: string | undefined
  clubId: string | undefined
  date: { day: number; month: string; full: string }
}) {
  const { t } = useTranslation()
  const signUp = useSignUp(clubId, memberId)
  const withdraw = useRemoveEntry(clubId)
  const [picking, setPicking] = useState(false)

  return (
    <Card className={entry ? 'border-aka/40' : ''}>
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-ai text-shiro">
          <span className="font-display text-xl font-bold leading-none">{date.day}</span>
          <span className="text-[9px] uppercase tracking-wider text-shiro/70">{date.month}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold uppercase tracking-wide text-ink">{c.name}</p>
          <p className="text-xs text-muted">
            {c.start_time ? `${c.start_time.slice(0, 5)} · ` : ''}
            {c.location}
          </p>
        </div>
        {entry && <span className="text-lg">🏆</span>}
      </div>
      {c.notes && <p className="mt-3 whitespace-pre-line text-sm text-muted">{c.notes}</p>}

      {entry ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-aka/10 px-3 py-2">
          <p className="text-sm text-ink">
            {t('competitions.signedUp')} <b>{entry.category}</b>
          </p>
          {c.registration_open && !entry.placement && (
            <button type="button" onClick={() => withdraw.mutate(entry.id)} disabled={withdraw.isPending} className="shrink-0 text-xs text-muted underline hover:text-aka-text">
              {t('competitions.withdraw')}
            </button>
          )}
        </div>
      ) : (
        c.registration_open &&
        memberId && (
          <>
            {!picking ? (
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="mt-3 min-h-11 w-full rounded-xl bg-aka font-display text-sm uppercase tracking-wide text-shiro shadow-[0_12px_24px_-12px_color-mix(in_srgb,var(--color-aka)_90%,transparent)]"
              >
                {t('competitions.signUp')}
              </button>
            ) : (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{t('competitions.pickDiscipline')}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {c.disciplines.map((d) => (
                      <button
                        key={d}
                        type="button"
                        disabled={signUp.isPending}
                        onClick={() => signUp.mutate({ competitionId: c.id, discipline: d }, { onSuccess: () => setPicking(false) })}
                        className="min-h-11 rounded-xl border border-ink/15 px-2 font-display text-xs uppercase tracking-wide text-ink transition-colors hover:border-aka-text hover:text-aka-text disabled:opacity-50"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  {signUp.error && <p className="mt-2 text-xs text-aka-text">{t('competitions.error')}</p>}
                  <button type="button" onClick={() => setPicking(false)} className="mt-2 w-full text-center text-xs text-muted">
                    {t('admin.edit.cancel')}
                  </button>
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )
      )}
    </Card>
  )
}
