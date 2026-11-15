import { AnimatePresence } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MemberAvatar } from '../../components/admin/MemberAvatar'
import { MemberDetailModal } from '../../components/admin/MemberDetailModal'
import { StudentFormModal } from '../../components/admin/StudentFormModal'
import { Pill, StatCard } from '../../components/admin/ui'
import { PageHeader, Stagger, StaggerItem } from '../../components/app/ui'
import { Stars } from '../../components/Stars'
import { useAdminMembers, type AdminMember } from '../../hooks/useAdminMembers'
import { useBelts } from '../../hooks/useBelts'
import { useClub } from '../../hooks/useClub'
import { useClubGradeAverages } from '../../hooks/useGrades'
import { beltLabel } from '../../lib/belts'

const STATUSES = ['active', 'trial', 'paused', 'left'] as const

const STATUS_TONE: Record<AdminMember['status'], 'jade' | 'kin' | 'aka' | 'muted'> = {
  active: 'jade',
  trial: 'kin',
  paused: 'aka',
  left: 'muted',
}

const ROLE_AVATAR: Record<AdminMember['role'], string> = {
  owner: 'bg-ink',
  coach: 'bg-ai',
  student: 'bg-aka',
}

const fieldClass =
  'min-h-11 rounded-xl border border-ink/15 bg-shiro/95 px-3 text-ink outline-none transition-colors focus:border-aka-text'

// Compact roster: one tidy row per person. Contacts, parent, ЕГН and grades
// open in the profile sheet; coaches add and edit students from here.
export function Members() {
  const { t, i18n } = useTranslation()
  const { data: club } = useClub()
  const { data: members, isLoading } = useAdminMembers(club?.id)
  const { data: belts } = useBelts(club?.id)
  const { data: averages } = useClubGradeAverages(club?.id, !!club?.grades_enabled)

  const [search, setSearch] = useState('')
  const [beltFilter, setBeltFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [open, setOpen] = useState<AdminMember | null>(null)
  const [form, setForm] = useState<{ member?: AdminMember } | null>(null)

  const filtered = useMemo(() => {
    return (members ?? []).filter((m) => {
      if (search && !m.full_name.toLowerCase().includes(search.toLowerCase())) return false
      if (beltFilter && m.belt?.id !== beltFilter) return false
      if (statusFilter && m.status !== statusFilter) return false
      return true
    })
  }, [members, search, beltFilter, statusFilter])

  if (!club) return null

  const count = (status: AdminMember['status']) => (members ?? []).filter((m) => m.status === status).length

  return (
    <div className="px-5 py-6">
      <PageHeader kanji="人" title={t('admin.members.title')} tone="bg-ai">
        <button
          type="button"
          onClick={() => setForm({})}
          className="shrink-0 rounded-full bg-aka px-4 py-2.5 font-display text-xs uppercase tracking-wide text-shiro shadow-[0_10px_20px_-10px_rgba(194,54,31,0.9)] transition-transform active:scale-95"
        >
          + {t('admin.student.addButton')}
        </button>
      </PageHeader>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatCard label={t('admin.status.active')} value={count('active')} kanji="活" tone="bg-jade" />
        <StatCard label={t('admin.status.trial')} value={count('trial')} kanji="試" tone="bg-kin" />
        <StatCard label={t('admin.status.paused')} value={count('paused')} kanji="休" tone="bg-aka" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.members.searchPlaceholder')}
          className={`${fieldClass} min-w-48 flex-1`}
        />
        <select value={beltFilter} onChange={(e) => setBeltFilter(e.target.value)} className={fieldClass}>
          <option value="">{t('admin.members.allBelts')}</option>
          {belts?.map((b) => (
            <option key={b.id} value={b.id}>
              {beltLabel(b, i18n.resolvedLanguage)}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={fieldClass}>
          <option value="">{t('admin.members.allStatuses')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`admin.status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="p-6 text-center text-muted">...</p>}

      <Stagger
        key={`${search}|${beltFilter}|${statusFilter}`}
        className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-shiro/95 shadow-[0_16px_32px_-24px_rgba(31,27,22,0.55)]"
      >
        {filtered.map((m) => (
          <StaggerItem key={m.id}>
            <button
              type="button"
              onClick={() => setOpen(m)}
              className="flex w-full items-center gap-3 border-b border-ink/10 px-4 py-3 text-left transition-colors last:border-0 hover:bg-kuro/60"
            >
              <MemberAvatar name={m.full_name} photoPath={m.photo_path} tone={ROLE_AVATAR[m.role]} className="h-10 w-10 text-xs" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-sm font-semibold uppercase tracking-wide text-ink">{m.full_name}</span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  {m.belt ? (
                    <>
                      <span
                        className="h-2 w-6 shrink-0 rounded-full ring-1 ring-ink/15"
                        style={{
                          background: m.belt.color2_hex
                            ? `linear-gradient(${m.belt.color_hex} 38%, ${m.belt.color2_hex} 38% 62%, ${m.belt.color_hex} 62%)`
                            : m.belt.color_hex,
                        }}
                      />
                      <span className="truncate">{beltLabel(m.belt, i18n.resolvedLanguage)}</span>
                    </>
                  ) : (
                    <span>{t(`admin.role.${m.role}`)}</span>
                  )}
                  {averages?.[m.id] && <Stars value={averages[m.id].avg} size="h-3 w-3" />}
                </span>
              </span>
              <Pill tone={STATUS_TONE[m.status]}>{t(`admin.status.${m.status}`)}</Pill>
              <span className="text-muted" aria-hidden="true">
                ›
              </span>
            </button>
          </StaggerItem>
        ))}
      </Stagger>
      {!isLoading && filtered.length === 0 && <p className="mt-6 text-center text-sm text-muted">{t('admin.student.none')}</p>}

      <AnimatePresence>
        {open && (
          <MemberDetailModal
            key="detail"
            clubId={club.id}
            member={open}
            gradesEnabled={club.grades_enabled}
            onClose={() => setOpen(null)}
            onEdit={() => {
              setForm({ member: open })
              setOpen(null)
            }}
          />
        )}
        {form && <StudentFormModal key="form" clubId={club.id} member={form.member} onClose={() => setForm(null)} />}
      </AnimatePresence>
    </div>
  )
}
