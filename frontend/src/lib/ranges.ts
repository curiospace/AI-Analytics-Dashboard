import type { Meta } from './types'

export type RangeOption = { id: string; label: string; from?: string; to?: string }

// ISO dates ("2026-12-31") sort correctly as plain strings, so they can be compared with < and >
const iso = (d: Date) => d.toISOString().slice(0, 10)
const utc = (s: string) => new Date(`${s}T00:00:00Z`)

// first day of the month that is n months before the month of `date`
const monthsBack = (date: string, n: number) => {
  const d = utc(date)
  return iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - n, 1)))
}

const monthYear = (s: string) =>
  utc(s).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })

// every option is derived from the data's own first and last date, so new years appear by themselves
export function buildRanges(meta: Meta): RangeOption[] {
  const { date_min: min, date_max: max } = meta
  const clamp = (from: string) => (from < min ? min : from)
  const minYear = Number(min.slice(0, 4))
  const maxYear = Number(max.slice(0, 4))

  const years: RangeOption[] = []
  for (let y = maxYear; y >= minYear; y--) {
    const yearEnd = `${y}-12-31`
    years.push({ id: String(y), label: String(y), from: clamp(`${y}-01-01`), to: yearEnd > max ? max : yearEnd })
  }

  return [
    { id: 'all', label: 'All time' },
    { id: 'last12', label: 'Last 12 months', from: clamp(monthsBack(max, 11)), to: max },
    { id: 'last6', label: 'Last 6 months', from: clamp(monthsBack(max, 5)), to: max },
    ...years,
  ]
}

export const describeRange = (from: string, to: string) => `${monthYear(from)} – ${monthYear(to)}`
