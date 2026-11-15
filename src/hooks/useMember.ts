import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'

export interface MemberBelt {
  id: string
  rank: number
  name_bg: string
  name_en: string
  color_hex: string
  color2_hex: string | null
  grade_bg: string | null
  grade_en: string | null
}

export interface Member {
  id: string
  full_name: string
  role: 'owner' | 'coach' | 'student'
  status: 'active' | 'trial' | 'paused' | 'left'
  group_id: string | null
  photo_path: string | null
  birth_year: number | null
  height_cm: number | null
  weight_kg: number | null
  belt: MemberBelt | null
}

const COLUMNS =
  'id, full_name, role, status, group_id, photo_path, birth_year, height_cm, weight_kg, belt:belts(id, rank, name_bg, name_en, color_hex, color2_hex, grade_bg, grade_en)'
const RANK = { owner: 0, coach: 1, student: 2 } as const

// Every members row of this login in the club. Usually one; a parent with
// two kids in the club has two, a coach with a child training has both.
// Staff rows first, then children by name.
export function useMyMembers(clubId: string | undefined) {
  const { session } = useAuth()
  const userId = session?.user.id
  return useQuery({
    queryKey: ['my-members', clubId, userId],
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from('members')
        .select(COLUMNS)
        .eq('club_id', clubId as string)
        .eq('user_id', userId as string)
      if (error) throw error
      return (data as unknown as Member[]).sort(
        (a, b) => RANK[a.role] - RANK[b.role] || a.full_name.localeCompare(b.full_name, 'bg'),
      )
    },
    enabled: !!clubId && !!userId,
  })
}

// Which child (or the coach's own row) the app is showing, per club,
// remembered on this device.
const key = (clubId: string) => `tatami-member-${clubId}`
const listeners = new Set<() => void>()
function readSelected(clubId: string | undefined): string | null {
  if (!clubId) return null
  try {
    return localStorage.getItem(key(clubId))
  } catch {
    return null
  }
}
export function selectMember(clubId: string, memberId: string) {
  try {
    localStorage.setItem(key(clubId), memberId)
  } catch {
    // Not remembered (private mode); the switch still works this session.
  }
  memorySelection.set(clubId, memberId)
  listeners.forEach((l) => l())
}
const memorySelection = new Map<string, string>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

// The member the app is "being" right now. Same shape as a single query so
// pages keep using { data, isLoading }.
export function useMember(clubId: string | undefined) {
  const list = useMyMembers(clubId)
  const selectedId = useSyncExternalStore(subscribe, () => (clubId ? memorySelection.get(clubId) ?? readSelected(clubId) : null))
  const members = list.data ?? []
  const data = members.find((m) => m.id === selectedId) ?? members[0]
  return { ...list, data }
}

// Owner/coach rights in this club, whichever child is selected.
export function useStaffMember(clubId: string | undefined) {
  const list = useMyMembers(clubId)
  return { ...list, data: list.data?.find((m) => m.role !== 'student') ?? null }
}
