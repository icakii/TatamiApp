import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export const DEFAULT_DISCIPLINES = ['Ката', 'Кумите', 'Отборно ката', 'Отборно кумите']

export interface Competition {
  id: string
  name: string
  location: string | null
  event_date: string
  start_time: string | null
  notes: string | null
  disciplines: string[]
  registration_open: boolean
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

export interface StaffEntry extends CompetitionEntry {
  created_at: string
  member: { full_name: string; birth_year: number | null; belt: { name_bg: string; grade_bg: string | null } | null } | null
}

const COLUMNS = 'id, name, location, event_date, start_time, notes, disciplines, registration_open'

export type CompetitionFields = Omit<Competition, 'id'>

// Coaches run competitions from the admin panel: add, edit, open sign-ups.
export function useSaveCompetition(clubId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, fields }: { id?: string; fields: CompetitionFields }) => {
      const row = { ...fields, updated_at: new Date().toISOString() }
      const { error } = id
        ? await supabase.from('competitions').update(row).eq('id', id)
        : await supabase.from('competitions').insert({ ...row, club_id: clubId })
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
        .select(COLUMNS)
        .eq('club_id', clubId as string)
        .order('event_date', { ascending: false })
      if (error) throw error
      return data as Competition[]
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
        .select(`id, competition_id, member_id, category, placement, medal, note, competition:competitions(${COLUMNS})`)
        .eq('club_id', clubId as string)
        .eq('member_id', memberId as string)
      if (error) throw error
      return data as unknown as MyCompetitionEntry[]
    },
    enabled: !!clubId && !!memberId,
  })
}

// The coach's list: everyone signed up for one competition.
export function useCompetitionEntries(clubId: string | undefined, competitionId: string | null) {
  return useQuery({
    queryKey: ['competition-entries', competitionId],
    queryFn: async (): Promise<StaffEntry[]> => {
      const { data, error } = await supabase
        .from('competition_entries')
        .select('id, competition_id, member_id, category, placement, medal, note, created_at, member:members(full_name, birth_year, belt:belts(name_bg, grade_bg))')
        .eq('club_id', clubId as string)
        .eq('competition_id', competitionId as string)
        .order('created_at')
      if (error) throw error
      return data as unknown as StaffEntry[]
    },
    enabled: !!clubId && !!competitionId,
  })
}

// A student or parent signs a child up in one discipline, or withdraws.
export function useSignUp(clubId: string | undefined, memberId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ competitionId, discipline }: { competitionId: string; discipline: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { error } = await supabase.from('competition_entries').insert({
        club_id: clubId,
        competition_id: competitionId,
        member_id: memberId,
        category: discipline,
        signed_up_by: user?.id,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-competition-entries', clubId, memberId] }),
  })
}

export function useRemoveEntry(clubId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.from('competition_entries').delete().eq('id', entryId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-competition-entries', clubId] })
      queryClient.invalidateQueries({ queryKey: ['competition-entries'] })
    },
  })
}
