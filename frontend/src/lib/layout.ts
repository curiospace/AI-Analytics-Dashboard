import type { ChartSpec } from './chatTypes'

// Width in thirds of the widest grid: 1 = a third, 2 = two thirds, 3 = the full row.
export type Width = 1 | 2 | 3
export type Pin = { id: string; spec: ChartSpec; pinnedAt: string }

// the built-in panels, in their default order and widths
export const PANELS: { id: string; title: string; width: Width }[] = [
  { id: 'orders', title: 'Orders created vs delivered', width: 2 },
  { id: 'revenue', title: 'Revenue vs cost', width: 1 },
  { id: 'ontime', title: 'On-time delivery vs resignations', width: 3 },
  { id: 'hours', title: 'Where the hours go', width: 1 },
  { id: 'profit', title: 'Profit per order', width: 1 },
  { id: 'products', title: 'Accepted orders by product', width: 1 },
]
export const PINNED_WIDTH: Width = 1

// a pin is the chart's rows at the time it was pinned; `key` recognises the same chart again in the chat
export const pinKey = (s: ChartSpec) => JSON.stringify([s.title, s.type, s.sql ?? '', s.rows.length])

// Packs tiles of the given widths into rows of `cols` columns, in order, and returns each tile's final width.
// A tile never moves: when the next one does not fit, the last tile of the unfinished row widens to fill it,
// so no row is left with a hole (the No-Orphan rule) whatever order and widths the user picks.
export function fillRows(widths: number[], cols: number): number[] {
  const out = widths.map((w) => Math.max(1, Math.min(w, cols)))
  let used = 0
  for (let i = 0; i < out.length; i++) {
    if (used + out[i] > cols) {
      out[i - 1] += cols - used
      used = 0
    }
    used = (used + out[i]) % cols
  }
  if (used > 0) out[out.length - 1] += cols - used
  return out
}
