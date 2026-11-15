import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useClub } from '../../hooks/useClub'
import { selectMember, useMember, useMyMembers } from '../../hooks/useMember'
import { MemberAvatar } from '../admin/MemberAvatar'

// A parent's login holds every child they have in the club (and a coach can
// have a child training too). With more than one, switch between them here;
// the whole app then shows that child.
export function ChildSwitcher() {
  const { t } = useTranslation()
  const { data: club } = useClub()
  const { data: members } = useMyMembers(club?.id)
  const { data: current } = useMember(club?.id)
  const queryClient = useQueryClient()

  if (!club || !members || members.length < 2) return null

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-3">
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-ink/10 bg-shiro/95 p-1.5" role="tablist" aria-label={t('family.switch')}>
        {members.map((m) => {
          const active = m.id === current?.id
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                selectMember(club.id, m.id)
                queryClient.invalidateQueries()
              }}
              className={`relative flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 font-display text-xs uppercase tracking-wide transition-colors ${
                active ? 'text-shiro' : 'text-muted hover:text-ink'
              }`}
            >
              {active && (
                <motion.span layoutId="child-pill" className="absolute inset-0 rounded-xl bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
              )}
              <span className="relative">
                <MemberAvatar name={m.full_name} photoPath={m.photo_path} className="h-7 w-7 text-[10px]" />
              </span>
              <span className="relative">
                {m.role === 'student' ? m.full_name.split(' ')[0] : t(`admin.role.${m.role}`)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
