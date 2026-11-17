import { AnimatePresence, motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/app/ui'
import { useClub } from '../../hooks/useClub'
import { useGroups } from '../../hooks/useGroups'
import { useDeleteMessage, useSendMessage, useSentMessages } from '../../hooks/useMessages'

const fieldClass =
  'mt-1 w-full rounded-xl border border-ink/15 bg-kuro px-3 text-ink outline-none transition-colors focus:border-aka-text'
const labelClass = 'block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted'

// The coach writes a message; it lands in "Съобщения" on the home screen of
// every student (or one group) with a login.
export function Messages() {
  const { t, i18n } = useTranslation()
  const { data: club } = useClub()
  const { data: groups } = useGroups(club?.id)
  const { data: sent } = useSentMessages(club?.id)
  const send = useSendMessage(club?.id)
  const remove = useDeleteMessage(club?.id)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [groupId, setGroupId] = useState('')
  const [result, setResult] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setResult(null)
    try {
      const count = await send.mutateAsync({ title: title.trim(), body: body.trim(), groupId: groupId || null })
      setTitle('')
      setBody('')
      setResult(t('admin.messages.sent', { count }))
    } catch (err) {
      setResult(err instanceof Error ? err.message : t('admin.edit.error'))
    }
  }

  const groupName = (ids?: string[]) => groups?.find((g) => g.id === ids?.[0])?.name

  return (
    <div className="px-5 py-6">
      <PageHeader kanji="信" title={t('admin.messages.title')} />
      <p className="mt-2 text-sm text-muted">{t('admin.messages.body')}</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4 rounded-2xl border border-ink/10 bg-shiro/95 p-5 shadow-[0_16px_32px_-24px_rgba(31,27,22,0.55)]">
        <label className="block">
          <span className={labelClass}>{t('admin.messages.to')}</span>
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={`${fieldClass} min-h-11`}>
            <option value="">{t('admin.messages.everyone')}</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>{t('admin.messages.subject')}</span>
          <input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('admin.messages.subjectPlaceholder')} className={`${fieldClass} min-h-11`} />
        </label>
        <label className="block">
          <span className={labelClass}>{t('admin.messages.text')}</span>
          <textarea required rows={4} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} className={`${fieldClass} py-2.5`} />
        </label>
        <button
          type="submit"
          disabled={send.isPending}
          className="min-h-12 w-full rounded-xl bg-aka font-display text-sm uppercase tracking-wide text-shiro shadow-[0_12px_24px_-12px_color-mix(in_srgb,var(--color-aka)_90%,transparent)] transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {send.isPending ? '...' : t('admin.messages.send')}
        </button>
        <AnimatePresence>
          {result && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-jade/10 px-4 py-3 text-sm text-ink">
              {result}
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      <h2 className="mt-8 font-display text-sm uppercase tracking-[0.2em] text-muted">{t('admin.messages.history')}</h2>
      {sent && sent.length === 0 && <p className="mt-3 text-sm text-muted-2">{t('admin.messages.none')}</p>}
      <ul className="mt-3 space-y-3">
        {sent?.map((m) => (
          <li key={m.id} className="rounded-2xl border border-ink/10 bg-shiro/95 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base uppercase tracking-wide text-ink">{m.title}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-muted">{m.body_bg}</p>
              </div>
              <button
                type="button"
                onClick={() => window.confirm(t('admin.messages.confirmDelete')) && remove.mutate(m.id)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs text-muted hover:text-aka-text"
              >
                {t('admin.messages.delete')}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-2">
              {new Date(m.created_at).toLocaleDateString(i18n.resolvedLanguage)} ·{' '}
              {m.audience.group_ids ? groupName(m.audience.group_ids) : t('admin.messages.everyone')} ·{' '}
              {t('admin.messages.recipients', { count: m.notifications[0]?.count ?? 0 })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
