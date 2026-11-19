// YYYY-MM-DD in the user's own timezone. toISOString() is UTC, which in
// Bulgaria (UTC+2/+3) turns local midnight into the previous day.
export function localISODate(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// "дек.", "Dec": the short month name. Bulgarian short dates are numeric
// ("12.12"), so Bulgarian uses its own list.
const BG_MONTHS = ['ян.', 'февр.', 'март', 'апр.', 'май', 'юни', 'юли', 'авг.', 'септ.', 'окт.', 'ноем.', 'дек.']

export function shortMonth(iso: string, lang: string | undefined): string {
  const d = new Date(`${iso}T00:00:00`)
  if (!lang || lang.startsWith('bg')) return BG_MONTHS[d.getMonth()]
  return d.toLocaleDateString(lang, { month: 'short' })
}
