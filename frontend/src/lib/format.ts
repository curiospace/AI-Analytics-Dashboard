// Every formatter accepts null: the API returns null averages for a range with no delivered orders,
// and a missing value must render as a dash, never crash the page or pretend to be zero.
const compactUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  // three significant digits, zeros kept: $4.98M, $10.6K, $214K, and $3.16K next to $5.60K in one sentence
  minimumSignificantDigits: 3,
  maximumSignificantDigits: 3,
})
const pct = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const known = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n)

export const NONE = '–'
// money on a chart axis: the shortest form, "$300K", "$5.5K", "$0"
const axisUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })
export const usdAxis = (n: number) => axisUsd.format(n)

export const usd = (n: number | null | undefined) => (!known(n) ? NONE : n === 0 ? '$0' : compactUsd.format(n)) // not "$0.00"
export const percent = (n: number | null | undefined) => (known(n) ? pct.format(n) : NONE) // 0.863 -> "86.3%"
export const days = (n: number | null | undefined) => (known(n) ? `${n.toFixed(1)} d` : NONE)
export const hours = (n: number | null | undefined) => (known(n) ? `${n.toFixed(1)} h` : NONE)
// "1 month", "24 months"
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

// "November 2025": for sentences, where "Nov 25" could be read as the 25th of November
export const monthName = (m: string) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

// "Nov 25": for chart axes, markers and tables only
export const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
