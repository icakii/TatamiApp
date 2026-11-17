import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

// Coach messages: one announcements row (what the coach wrote and to whom),
// copied into each student's inbox as notifications. That inbox is the
// "Съобщения" card on the student's home screen.
export interface SentMessage {
  id: string
  title: string
  body_bg: string
  audience: { all?: boolean; group_ids?: string[] }
  created_at: string
  notifications: { count: number }[]
}

export function useSentMessages(clubId: string | undefined) {
  return useQuery({
    queryKey: ['sent-messages', clubId],
    queryFn: async (): Promise<SentMessage[]> => {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, body_bg, audience, created_at, notifications(count)')
        .eq('club_id', clubId as string)
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return data as unknown as SentMessage[]
    },
    enabled: !!clubId,
  })
}

export function useSendMessage(clubId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, body, groupId }: { title: string; body: string; groupId: string | null }) => {
      let recipients = supabase
        .from('members')
        .select('id')
        .eq('club_id', clubId as string)
        .eq('role', 'student')
        .neq('status', 'left')
        .not('user_id', 'is', null)
      if (groupId) recipients = recipients.eq('group_id', groupId)
      const { data: members, error: membersError } = await recipients
      if (membersError) throw membersError

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data: announcement, error } = await supabase
        .from('announcements')
        .insert({
          club_id: clubId,
          title,
          body_bg: body,
          audience: groupId ? { group_ids: [groupId] } : { all: true },
          channels: ['in_app'],
          created_by: user?.id,
          sent_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (error) throw error

      if (members.length > 0) {
        const { error: notifyError } = await supabase.from('notifications').insert(
          members.map((m) => ({ club_id: clubId, member_id: m.id, announcement_id: announcement.id, title, body })),
        )
        if (notifyError) throw notifyError
      }
      return members.length
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sent-messages', clubId] }),
  })
}

// Deleting the announcement removes it from every inbox (cascade).
export function useDeleteMessage(clubId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sent-messages', clubId] }),
  })
}
