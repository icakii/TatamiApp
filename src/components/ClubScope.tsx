import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet, useParams } from 'react-router-dom'
import { ClubProvider, clubAsset, useClub, type Club } from '../hooks/useClub'
import { ServicePaused } from '../pages/ServicePaused'

const SLUG = /^[a-z0-9-]{1,40}$/

// Darker shade of the accent for text on light backgrounds.
function darken(hex: string, amount = 0.14) {
  const n = parseInt(hex.slice(1), 16)
  const c = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount))
  return `#${[c(16), c(8), c(0)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

// Paints the page as this club: accent colour, tab title, and the install
// manifest/icons so "Add to home screen" puts the club's own app there.
function useClubHead(club: Club | null | undefined) {
  useEffect(() => {
    if (!club) return
    const root = document.documentElement.style
    root.setProperty('--color-aka', club.accent_color)
    root.setProperty('--color-aka-text', darken(club.accent_color))
    document.title = club.name
    const manifest = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/club-manifest`)
    manifest.searchParams.set('slug', club.slug)
    manifest.searchParams.set('app', window.location.origin)
    setLink('manifest', manifest.toString())
    setLink('apple-touch-icon', club.logo_path ? clubAsset(club.id, 'apple-touch-icon.png') : '/icons/apple-touch-icon.png')
    document.head.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', club.name)
    return () => {
      root.removeProperty('--color-aka')
      root.removeProperty('--color-aka-text')
      document.title = 'Tatami'
      setLink('manifest', '/manifest.webmanifest')
      setLink('apple-touch-icon', '/icons/apple-touch-icon.png')
    }
  }, [club])
}

function ClubGate() {
  const { t } = useTranslation()
  const { data: club, isLoading } = useClub()
  useClubHead(club)

  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-muted">...</div>
  if (!club) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="font-display text-2xl uppercase tracking-wide text-ink">{t('club.notFound')}</p>
        <Link to="/" className="rounded-2xl bg-ink px-6 py-3 font-display text-sm uppercase tracking-wide text-shiro">
          {t('club.toMyClubs')}
        </Link>
      </div>
    )
  }
  // A suspended club's own people still read their club (RLS), so gate here.
  if (club.status !== 'live') return <ServicePaused />
  return <Outlet />
}

export function ClubScope() {
  const { slug = '' } = useParams<{ slug: string }>()
  if (!SLUG.test(slug)) return <ClubGateNotFound />
  return (
    <ClubProvider slug={slug}>
      <ClubGate />
    </ClubProvider>
  )
}

function ClubGateNotFound() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center font-display text-2xl uppercase tracking-wide text-ink">
      {t('club.notFound')}
    </div>
  )
}
