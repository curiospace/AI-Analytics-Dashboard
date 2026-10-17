import { monthName, plural, usd } from './format'
import type { NameValue, OnTimeRow, ProfitRow, RevenueRow } from './types'

// each function looks at one dataset and returns one plain-English finding, or null if there is nothing to say
export type Signal = { tag: string; tone: 'accent' | 'alert'; text: string }

export function bottleneck(stages: NameValue[]): Signal | null {
  const rows = stages.filter((r) => r.value != null)
  const total = rows.reduce((sum, r) => sum + r.value, 0)
  if (!total) return null
  const top = rows.reduce((a, b) => (b.value > a.value ? b : a))
  return {
    tag: 'Bottleneck',
    tone: 'accent',
    text: `${top.name} takes ${Math.round((top.value / total) * 100)}% of labour hours: ${top.value.toFixed(1)} of ${total.toFixed(1)} hours per order.`,
  }
}

export function onTimeDip(rows: OnTimeRow[]): Signal | null {
  const withData = rows.filter((r) => r.on_time_pct !== null)
  if (!withData.length) return null
  const low = withData.reduce((a, b) => (b.on_time_pct! < a.on_time_pct! ? b : a))
  const pct = Math.round(low.on_time_pct! * 100)
  // with a single month there is nothing to fall from: state the level instead
  if (withData.length === 1) {
    return { tag: 'On-time', tone: pct < 90 ? 'alert' : 'accent', text: `On-time delivery was ${pct}% in ${monthName(low.month)}, the only month in this range with deliveries.` }
  }
  if (pct >= 90) return { tag: 'On-time', tone: 'accent', text: `On-time delivery never fell below ${pct}% in any month.` }

  const i = rows.indexOf(low)
  const resigned = rows.slice(Math.max(0, i - 4), i).reduce((sum, r) => sum + r.resignations, 0)
  const after = resigned ? `, after ${resigned} resignation${resigned > 1 ? 's' : ''} in the previous 4 months` : ''
  return { tag: 'On-time', tone: 'alert', text: `On-time delivery fell to ${pct}% in ${monthName(low.month)}${after}.` }
}

export function profitGap(rows: ProfitRow[]): Signal | null {
  if (rows.length < 2) return null
  const best = rows.reduce((a, b) => (b.avg_profit > a.avg_profit ? b : a))
  const worst = rows.reduce((a, b) => (b.avg_profit < a.avg_profit ? b : a))
  if (best.avg_profit <= 0) return null
  const less = Math.round((1 - worst.avg_profit / best.avg_profit) * 100)
  return {
    tag: 'Profit',
    tone: 'alert',
    text: `${worst.name} earns ${usd(worst.avg_profit)} per order, ${less}% less than ${best.name} at ${usd(best.avg_profit)}.`,
  }
}

export function margin(rows: RevenueRow[], filteredByProduct: boolean): Signal | null {
  const revenue = rows.reduce((sum, r) => sum + r.revenue, 0)
  const cost = rows.reduce((sum, r) => sum + r.cost, 0)
  if (!revenue) return null
  const diff = revenue - cost
  const scope = filteredByProduct ? ' This covers all products: the ledger has no product split.' : ''
  if (diff < 0) {
    return { tag: 'Margin', tone: 'alert', text: `Costs exceeded revenue by ${usd(-diff)} over ${plural(rows.length, 'month')}.${scope}` }
  }
  const thin = diff / revenue < 0.1 ? ' only' : ''
  return {
    tag: 'Margin',
    tone: thin ? 'alert' : 'accent',
    text: `Revenue beat costs by${thin} ${usd(diff)} (${((diff / revenue) * 100).toFixed(1)}%) over ${plural(rows.length, 'month')}.${scope}`,
  }
}
