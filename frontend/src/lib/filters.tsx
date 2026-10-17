import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Filters } from './api'
import { buildRanges, describeRange, type RangeOption } from './ranges'
import type { Meta } from './types'
import { useMeta } from './useMeta'

type DateRange = { from: string; to: string }

type FiltersValue = {
  meta?: Meta
  ranges: RangeOption[] // generated from the data
  rangeId: string // an id from `ranges`, or 'custom'
  setRangeId: (id: string) => void
  custom: DateRange
  setCustom: (r: DateRange) => void
  rangeLabel: string
  product: string // '' = all products
  setProduct: (p: string) => void
  filters: Filters // what gets sent to the API
}

const FiltersContext = createContext<FiltersValue | null>(null)

export function FiltersProvider({ children }: { children: ReactNode }) {
  const { data: meta } = useMeta()
  const [rangeId, setRangeId] = useState('all')
  const [custom, setCustom] = useState<DateRange>({ from: '', to: '' })
  const [product, setProduct] = useState('')

  const ranges = useMemo(() => (meta ? buildRanges(meta) : [{ id: 'all', label: 'All time' }]), [meta])

  // no dates for "all": the backend then uses the full range that exists in the data
  const dates: Partial<DateRange> =
    rangeId === 'custom'
      ? custom.from && custom.to && custom.from <= custom.to ? custom : {}
      : (ranges.find((r) => r.id === rangeId) ?? {})

  const rangeLabel = !meta
    ? ''
    : rangeId === 'custom' && dates.from && dates.to
      ? `${dates.from} → ${dates.to}`
      : describeRange(dates.from ?? meta.date_min, dates.to ?? meta.date_max)

  const filters = useMemo<Filters>(
    () => ({ from: dates.from, to: dates.to, productType: product || undefined }),
    [dates.from, dates.to, product],
  )

  return (
    <FiltersContext.Provider
      value={{ meta, ranges, rangeId, setRangeId, custom, setCustom, rangeLabel, product, setProduct, filters }}
    >
      {children}
    </FiltersContext.Provider>
  )
}

export function useFilters() {
  const value = useContext(FiltersContext)
  if (!value) throw new Error('useFilters must be used inside <FiltersProvider>')
  return value
}
