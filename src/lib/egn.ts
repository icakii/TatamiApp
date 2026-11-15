// Bulgarian personal number (ЕГН): YYMMDD + 3 digits + check digit.
// Months are +20 for people born in the 1800s and +40 for the 2000s.

const WEIGHTS = [2, 4, 8, 5, 10, 9, 7, 3, 6]

export function isValidEgn(egn: string): boolean {
  if (!/^[0-9]{10}$/.test(egn)) return false
  const d = egn.split('').map(Number)
  const sum = WEIGHTS.reduce((s, w, i) => s + w * d[i], 0)
  const check = sum % 11 === 10 ? 0 : sum % 11
  if (check !== d[9]) return false
  return egnBirthDate(egn) !== null
}

export function egnBirthDate(egn: string): Date | null {
  if (!/^[0-9]{6}/.test(egn)) return null
  let year = Number(egn.slice(0, 2))
  let month = Number(egn.slice(2, 4))
  const day = Number(egn.slice(4, 6))
  if (month > 40) {
    month -= 40
    year += 2000
  } else if (month > 20) {
    month -= 20
    year += 1800
  } else {
    year += 1900
  }
  const date = new Date(year, month - 1, day)
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

// Shown in lists: only the last digits, the whole number stays in the profile.
export const maskEgn = (egn: string) => `••••••${egn.slice(6)}`
