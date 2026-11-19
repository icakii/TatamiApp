import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'

// The club's registration code: students and parents type it in the app to
// sign up. The coach copies it, or makes a new one if it got passed around.
export function JoinCodeCard({ clubId }: { clubId: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const { data: code } = useQuery({
    queryKey: ['join-code', clubId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('club_join_code', { p_club_id: clubId })
      if (error) throw error
      return data as string
    },
  })
  const rotate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('rotate_join_code', { p_club_id: clubId })
      if (error) throw error
      return data as string
    },
    onSuccess: (c) => queryClient.setQueryData(['join-code', clubId], c),
  })

  async function copy() {
    if (!code) return
    const text = t('admin.joinCode.share', { code, url: 'app.tatamistudio.net' })
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('', text)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-ink/10 bg-shiro/95 p-4 shadow-[0_16px_32px_-24px_rgba(31,27,22,0.55)]">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{t('admin.joinCode.label')}</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-[0.3em] text-ink">{code ?? '······'}</p>
        <p className="mt-1 text-xs text-muted">{t('admin.joinCode.hint')}</p>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={copy} className="min-h-11 rounded-xl bg-ink px-4 font-display text-xs uppercase tracking-wide text-shiro">
          {copied ? '✓' : t('admin.joinCode.copy')}
        </button>
        <button
          type="button"
          disabled={rotate.isPending}
          onClick={() => window.confirm(t('admin.joinCode.rotateConfirm')) && rotate.mutate()}
          className="min-h-11 rounded-xl border border-ink/15 px-4 font-display text-xs uppercase tracking-wide text-muted hover:text-ink"
        >
          {t('admin.joinCode.rotate')}
        </button>
      </div>
    </div>
  )
}
