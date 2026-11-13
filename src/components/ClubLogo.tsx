import { clubAsset, type Club } from '../hooks/useClub'

// The club's own logo, or its initials on its accent colour until one is
// uploaded from the Hub.
export function ClubLogo({
  club,
  className = 'h-9 w-9',
}: {
  club: Pick<Club, 'id' | 'name' | 'logo_path' | 'accent_color'> | null | undefined
  className?: string
}) {
  if (!club) return <span className={`inline-block rounded-xl bg-ink/10 ${className}`} />
  if (club.logo_path) {
    return <img src={clubAsset(club.id, club.logo_path)} alt="" className={`shrink-0 rounded-xl object-contain ${className}`} />
  }
  const initials = club.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl font-display font-semibold text-shiro ${className}`}
      style={{ background: club.accent_color }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
