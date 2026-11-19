import { useQuery } from '@tanstack/react-query'
import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'

// One app for every club: the club is the first segment of the URL
// (app.tatamistudio.net/<slug>/...). ClubProvider sits on the /:slug route
// and every page below it reads "its" club through useClub().

export interface Club {
  id: string
  slug: string
  name: string
  default_locale: 'bg' | 'en'
  status: 'draft' | 'live' | 'paused'
  logo_path: string | null
  accent_color: string
  // Optional extras, switched on from the Hub.
  grades_enabled: boolean
  qr_checkin_enabled: boolean
  store_enabled: boolean
  // The club's own rules / consent text (null = the standard one).
  member_terms: string | null
  member_terms_updated_at: string | null
}

const COLUMNS = 'id, slug, name, default_locale, status, logo_path, accent_color, grades_enabled, qr_checkin_enabled, store_enabled, member_terms, member_terms_updated_at'

const ClubContext = createContext<string | null>(null)

export function ClubProvider({ slug, children }: { slug: string; children: ReactNode }) {
  return <ClubContext.Provider value={slug}>{children}</ClubContext.Provider>
}

export const useClubSlug = () => useContext(ClubContext)

export function useClub() {
  const slug = useClubSlug()
  return useQuery({
    queryKey: ['club', slug],
    queryFn: async (): Promise<Club | null> => {
      // RLS: anyone sees live clubs; members also see their own paused one.
      const { data, error } = await supabase.from('clubs').select(COLUMNS).eq('slug', slug as string).maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}

// Builds links inside the current club: path('/schedule') -> '/kime/schedule'.
export function useClubPath() {
  const slug = useClubSlug()
  return useCallback((path = '') => `/${slug}${path}`, [slug])
}

export const clubAsset = (clubId: string, file: string) =>
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/club-assets/${clubId}/${file}`

export interface MyClub {
  role: 'owner' | 'coach' | 'student'
  club: Pick<Club, 'id' | 'slug' | 'name' | 'logo_path' | 'accent_color' | 'status'>
}

// Every club the signed-in person belongs to (a parent can have kids in two).
export function useMyClubs(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-clubs', userId],
    queryFn: async (): Promise<MyClub[]> => {
      const { data, error } = await supabase
        .from('members')
        .select('role, club:clubs(id, slug, name, logo_path, accent_color, status)')
        .eq('user_id', userId as string)
      if (error) throw error
      return (data as unknown as MyClub[]).filter((m) => m.club)
    },
    enabled: !!userId,
  })
}

const DEFAULT_KEY = 'tatami-default-club'

export function getDefaultClub(): string | null {
  try {
    return localStorage.getItem(DEFAULT_KEY)
  } catch {
    return null
  }
}

export function setDefaultClub(slug: string) {
  try {
    localStorage.setItem(DEFAULT_KEY, slug)
  } catch {
    // Private mode etc.: the picker still works, it just won't be remembered.
  }
}
