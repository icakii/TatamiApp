// Children's logins are usernames ("maria.spartak"), not emails. Supabase
// still needs an address, so a username lives on a placeholder domain that
// never receives mail (see the create-member-account function).
export const LOGIN_DOMAIN = 'login.tatamistudio.net'

const LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya',
}

function latin(word: string): string {
  return [...word.toLowerCase()].map((c) => LATIN[c] ?? c).join('').replace(/[^a-z0-9]/g, '')
}

// The username the server will most likely pick (it adds a number on a clash).
export function usernamePreview(fullName: string, slug: string | undefined): string {
  return `${latin(fullName.trim().split(/\s+/)[0] ?? '') || 'uchenik'}.${latin(slug ?? 'club')}`
}

// What the login form sends: an email as typed, or a username turned into
// its address. On a club's login page "maria" alone means "maria.<club>".
export function toLoginEmail(input: string, slug: string | undefined): string {
  const v = input.trim().toLowerCase()
  if (v.includes('@')) return v
  return `${v.includes('.') || !slug ? v : `${v}.${slug}`}@${LOGIN_DOMAIN}`
}

// The first password: the child's birthday as ДДММГГГГ, which parents know
// by heart (the project requires 8+ characters). They can change it in Profile.
export function birthdayPassword(born: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(born.getDate())}${pad(born.getMonth() + 1)}${born.getFullYear()}`
}

export function randomPin(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 100_000_000
  return String(n).padStart(8, '0')
}
