// YYYY-MM-DD in the user's own timezone. toISOString() is UTC, which in
// Bulgaria (UTC+2/+3) turns local midnight into the previous day.
export function localISODate(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// "дек.", "Dec": the short month name. Asking for the month alone gives "12"
// in Bulgarian, so format it together with the day and keep the month part.
export function shortMonth(iso: string, lang: string | undefined): string {
  const parts = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).formatToParts(new Date(`${iso}T00:00:00`))
  return parts.find((p) => p.type === 'month')?.value ?? ''
}
