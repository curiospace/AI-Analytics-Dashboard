import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ChartSpec } from './chatTypes'
import { PANELS, PINNED_WIDTH, pinKey, type Pin, type Width } from './layout'

export type { Pin, Width } from './layout'

// order of the panels, each panel's width (in thirds) and height (px; absent = its natural height), the pins
type Layout = { order: string[]; widths: Record<string, Width>; heights: Record<string, number>; pins: Pin[] }

// ponytail: saved in this browser only; a shared, per-user layout needs a backend table and a login
const KEY = 'mfc.dashboard.v1'

function fresh(pins: Pin[]): Layout {
  return { order: [...pins.map((p) => p.id), ...PANELS.map((p) => p.id)], widths: {}, heights: {}, pins }
}

function load(): Layout {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (!saved || !Array.isArray(saved.order) || !Array.isArray(saved.pins)) return fresh([])
    const pins: Pin[] = saved.pins.filter((p: Pin) => typeof p?.id === 'string' && Array.isArray(p?.spec?.rows))
    const known = new Set([...pins.map((p) => p.id), ...PANELS.map((p) => p.id)])
    const order: string[] = saved.order.filter((id: unknown) => typeof id === 'string' && known.has(id))
    for (const id of known) if (!order.includes(id)) order.push(id) // a panel added in a later version still shows
    return { order: [...new Set(order)], widths: saved.widths ?? {}, heights: saved.heights ?? {}, pins }
  } catch {
    return fresh([]) // storage blocked or corrupt: the default dashboard
  }
}

type DashboardValue = {
  order: string[]
  pins: Pin[]
  customised: boolean // anything moved or resized: shows "Reset layout"
  titleOf: (id: string) => string
  widthOf: (id: string) => Width
  heightOf: (id: string) => number | undefined
  setWidth: (id: string, width: Width) => void
  setHeight: (id: string, height: number | undefined) => void
  move: (id: string, to: number) => void
  pin: (spec: ChartSpec) => void
  unpin: (id: string) => void
  pinnedId: (spec: ChartSpec) => string | undefined
  reset: () => void
}

const DashboardContext = createContext<DashboardValue | null>(null)

const without = <T,>(record: Record<string, T>, id: string) => Object.fromEntries(Object.entries(record).filter(([k]) => k !== id))

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(layout))
    } catch {
      // private mode or full storage: the layout still works, it just is not remembered
    }
  }, [layout])

  const titleOf = useCallback(
    (id: string) => layout.pins.find((p) => p.id === id)?.spec.title ?? PANELS.find((p) => p.id === id)?.title ?? id,
    [layout.pins],
  )
  const widthOf = useCallback(
    (id: string) => layout.widths[id] ?? PANELS.find((p) => p.id === id)?.width ?? PINNED_WIDTH,
    [layout.widths],
  )
  const heightOf = useCallback((id: string) => layout.heights[id], [layout.heights])
  const setWidth = useCallback((id: string, width: Width) => setLayout((l) => ({ ...l, widths: { ...l.widths, [id]: width } })), [])
  const setHeight = useCallback(
    (id: string, height: number | undefined) =>
      setLayout((l) => ({ ...l, heights: height === undefined ? without(l.heights, id) : { ...l.heights, [id]: height } })),
    [],
  )
  const move = useCallback(
    (id: string, to: number) =>
      setLayout((l) => {
        const rest = l.order.filter((x) => x !== id)
        rest.splice(Math.max(0, Math.min(to, rest.length)), 0, id)
        return { ...l, order: rest }
      }),
    [],
  )
  // a new pin goes first in the grid, next to the chat, where the manager can see it land
  const pin = useCallback(
    (spec: ChartSpec) =>
      setLayout((l) => {
        if (l.pins.some((p) => pinKey(p.spec) === pinKey(spec))) return l
        const id = `pin-${crypto.randomUUID()}`
        return { ...l, pins: [{ id, spec, pinnedAt: new Date().toISOString() }, ...l.pins], order: [id, ...l.order] }
      }),
    [],
  )
  const unpin = useCallback(
    (id: string) =>
      setLayout((l) => ({
        pins: l.pins.filter((p) => p.id !== id),
        order: l.order.filter((x) => x !== id),
        widths: without(l.widths, id),
        heights: without(l.heights, id),
      })),
    [],
  )
  const pinnedId = useCallback((spec: ChartSpec) => layout.pins.find((p) => pinKey(p.spec) === pinKey(spec))?.id, [layout.pins])
  const reset = useCallback(() => setLayout((l) => fresh(l.pins)), [])

  const customised =
    Object.keys(layout.widths).length > 0 ||
    Object.keys(layout.heights).length > 0 ||
    layout.order.join() !== fresh(layout.pins).order.join()

  const value = useMemo(
    () => ({ order: layout.order, pins: layout.pins, customised, titleOf, widthOf, heightOf, setWidth, setHeight, move, pin, unpin, pinnedId, reset }),
    [layout.order, layout.pins, customised, titleOf, widthOf, heightOf, setWidth, setHeight, move, pin, unpin, pinnedId, reset],
  )
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const value = useContext(DashboardContext)
  if (!value) throw new Error('useDashboard must be used inside DashboardProvider')
  return value
}
