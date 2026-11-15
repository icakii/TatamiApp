import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export interface Competition {
  id: string
  name: string
  location: string | null
  event_date: string
  notes: string | null
}

export interface CompetitionEntry {
  id: string
  competition_id: string
  member_id: string
  category: string | null
  placement: string | null
  medal: 'gold' | 'silver' | 'bronze' | null
  note: string | null
}

export interface MyCompetitionEntry extends CompetitionEntry {
  competition: Competition
}

// Coaches add upcoming competitions themselves (2026-11-15); entries and
// results are still entered from the Hub.
export function useSaveCompetition(clubId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (c: { name: string; event_date: string; location: string | null; notes: string | null }) => {
      const { error } = await supabase.from('competitions').insert({ ...c, club_id: clubId })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['competitions', clubId] }),
  })
}

export function useDeleteCompetition(clubId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('competitions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['competitions', clubId] }),
  })
}

export function useCompetitions(clubId: string | undefined) {
  return useQuery({
    queryKey: ['competitions', clubId],
    queryFn: async (): Promise<Competition[]> => {
      const { data, error } = await supabase
        .from('competitions')
        .select('id, name, location, event_date, notes')
        .eq('club_id', clubId as string)
        .order('event_date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!clubId,
  })
}

export function useMyCompetitionEntries(clubId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ['my-competition-entries', clubId, memberId],
    queryFn: async (): Promise<MyCompetitionEntry[]> => {
      const { data, error } = await supabase
        .from('competition_entries')
        .select(
          'id, competition_id, member_id, category, placement, medal, note, competition:competitions(id, name, location, event_date, notes)',
        )
        .eq('club_id', clubId as string)
        .eq('member_id', memberId as string)
      if (error) throw error
      return data as unknown as MyCompetitionEntry[]
    },
    enabled: !!clubId && !!memberId,
  })
}
