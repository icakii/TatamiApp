import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Club } from '../../hooks/useClub'
import { defaultMemberTerms, memberTermsFor } from '../../lib/memberTerms'
import { supabase } from '../../lib/supabaseClient'
import { ClubTermsText } from '../ClubTerms'

// The coach's own rules and consent text (fees, hall rules, health...),
// accepted by parents at registration. Starts from the standard text.
export function MemberTermsCard({ club }: { club: Club }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const save = useMutation({
    mutationFn: async (terms: string) => {
      const { error } = await supabase.rpc('set_member_terms', { p_club_id: club.id, p_terms: terms })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club', club.slug] })
      setOpen(false)
    },
  })

  return (
    <div className="rounded-2xl border border-ink/10 bg-shiro/95 p-4 shadow-[0_16px_32px_-24px_rgba(31,27,22,0.55)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{t('admin.terms.label')}</p>
          <p className="mt-1 text-sm text-ink">{club.member_terms ? t('admin.terms.custom') : t('admin.terms.standard')}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setText(memberTermsFor(club))
            setOpen(true)
          }}
          className="min-h-11 rounded-xl border border-ink/15 px-4 font-display text-xs uppercase tracking-wide text-ink"
        >
          {t('admin.terms.edit')}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center sm:px-6" onClick={() => setOpen(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-3xl bg-shiro p-6 shadow-2xl sm:rounded-3xl"
            >
              <p className="font-display text-xl font-semibold uppercase tracking-wide text-ink">{t('admin.terms.title')}</p>
              <p className="mt-1 text-xs text-muted">{t('admin.terms.hint')}</p>
              <div className="mt-4 grid min-h-0 flex-1 gap-4 overflow-hidden md:grid-cols-2">
                <textarea
                  value={text}
                  maxLength={20000}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-72 w-full resize-none rounded-xl border border-ink/15 bg-kuro p-3 font-mono text-xs leading-relaxed text-ink outline-none focus:border-aka-text"
                />
                <div className="hidden overflow-y-auto rounded-xl border border-ink/10 p-3 text-sm text-muted md:block">
                  <ClubTermsText text={text} />
                </div>
              </div>
              {save.error && <p className="mt-2 text-sm text-aka-text">{(save.error as Error).message}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={() => setText(defaultMemberTerms(club.name))} className="text-xs uppercase tracking-wide text-muted hover:text-ink">
                  {t('admin.terms.reset')}
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-xl border border-ink/15 px-5 font-display text-xs uppercase tracking-wide text-muted">
                    {t('admin.edit.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={save.isPending}
                    onClick={() => save.mutate(text.trim() === defaultMemberTerms(club.name).trim() ? '' : text)}
                    className="min-h-11 rounded-xl bg-aka px-5 font-display text-xs uppercase tracking-wide text-shiro disabled:opacity-60"
                  >
                    {save.isPending ? '...' : t('admin.terms.save')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
