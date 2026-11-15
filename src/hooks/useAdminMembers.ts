import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { localISODate } from '../lib/date'
import type { MemberBelt } from './useMember'

export interface AdminMember {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  egn: string | null
  user_id: string | null
  role: 'owner' | 'coach' | 'student'
  status: 'active' | 'trial' | 'paused' | 'left'
  group_id: string | null
  monthly_fee_cents: number | null
  birth_year: number | null
  height_cm: number | null
  weight_kg: number | null
  guardian_first_name: string | null
  guardian_last_name: string | null
  guardian_phone: string | null
  guardian_email: string | null
  photo_path: string | null
  last_reminder_at: string | null
  joined_at: string | null
  belt: MemberBelt | null
}

// Club staff see and manage their own club's students (since 2026-11-15);
// roles and logins of other people stay with us.
export function useAdminMembers(clubId: string | undefined) {
  return useQuery({
    queryKey: ['admin-members', clubId],
    queryFn: async (): Promise<AdminMember[]> => {
      const { data, error } = await supabase
        .from('members')
        .select(
          'id, full_name, email, phone, egn, user_id, role, status, group_id, monthly_fee_cents, birth_year, height_cm, weight_kg, guardian_first_name, guardian_last_name, guardian_phone, guardian_email, photo_path, last_reminder_at, joined_at, belt:belts(id, rank, name_bg, name_en, color_hex, color2_hex, grade_bg, grade_en)',
        )
        .eq('club_id', clubId as string)
        .order('full_name')
      if (error) throw error
      return data as unknown as AdminMember[]
    },
    enabled: !!clubId,
  })
}

// The editable part of a student, as the forms hold it.
export interface StudentFields {
  full_name: string
  egn: string | null
  birth_year: number | null
  phone: string | null
  email: string | null
  group_id: string | null
  belt_id: string | null
  monthly_fee_cents: number | null
  status: AdminMember['status']
  height_cm: number | null
  weight_kg: number | null
  guardian_first_name: string | null
  guardian_last_name: string | null
  guardian_phone: string | null
  guardian_email: string | null
}

export function useSaveStudent(clubId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, fields }: { id?: string; fields: StudentFields }): Promise<string> => {
      if (id) {
        const { error } = await supabase.from('members').update(fields).eq('id', id)
        if (error) throw error
        return id
      }
      const { data, error } = await supabase
        .from('members')
        .insert({ ...fields, club_id: clubId, role: 'student', joined_at: localISODate() })
        .select('id')
        .single()
      if (error) throw error
      return data.id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-members', clubId] }),
  })
}

// Creates the app login for a student, or links the child to the parent's
// existing login when that email already has a child in the club.
export function useCreateLogin(clubId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId, email, password }: { memberId: string; email: string; password: string }) => {
      const { data, error } = await supabase.functions.invoke('create-member-account', {
        body: { club_id: clubId, member_id: memberId, email, password },
      })
      if (error) {
        // The function's own message (e.g. "email in use") is in the response body.
        const ctx = (error as { context?: Response }).context
        const msg = ctx ? ((await ctx.json().catch(() => null)) as { error?: string } | null)?.error : null
        throw new Error(msg ?? error.message)
      }
      return data as { linked_existing: boolean }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-members', clubId] }),
  })
}

// Photos live in a private bucket; read them through a short-lived URL.
export function usePhotoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['photo-url', path],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('member-photos').createSignedUrl(path as string, 3600)
      if (error) throw error
      return data.signedUrl
    },
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
  })
}
