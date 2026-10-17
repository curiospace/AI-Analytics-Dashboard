import { lineOption, memoByData } from '../lib/chartOptions'
import { monthName } from '../lib/format'
import { colors } from '../lib/theme'
import type { TrendRow } from '../lib/types'
import { useApi } from '../lib/useApi'
import { Chart } from './Chart'
import { Legend } from './Legend'
import { Panel } from './Panel'
import { PanelState } from './PanelState'

const buildOption = memoByData((rows: TrendRow[]) =>
  lineOption({
    months: rows.map((r) => r.month),
    maxLabels: 8,
    series: [
      { name: 'Created', data: rows.map((r) => r.created), color: colors.accent, area: true },
      { name: 'Delivered', data: rows.map((r) => r.completed), color: colors.series, dashed: true },
    ],
  }),
)

// what a screen reader hears instead of the chart
function describe(rows: TrendRow[]) {
  const peak = rows.reduce((a, b) => (b.created > a.created ? b : a))
  const delivered = rows.map((r) => r.completed)
  return (
    `Orders created and delivered per month, ${monthName(rows[0].month)} to ${monthName(rows[rows.length - 1].month)}. ` +
    `Created peaked at ${peak.created} in ${monthName(peak.month)}; delivered ranged from ${Math.min(...delivered)} to ${Math.max(...delivered)} a month.`
  )
}

export function OrdersTrendPanel() {
  const query = useApi<TrendRow[]>('orders-trend')
  const isEmpty = (d: TrendRow[]) => d.length === 0
  const drawn = query.data !== undefined && !isEmpty(query.data)

  return (
    <Panel
      title="Orders created vs delivered"
      right={drawn && <Legend items={[{ label: 'Created', color: colors.accent }, { label: 'Delivered', color: colors.series, dashed: true }]} />}
    >
      <PanelState query={query} what="the orders trend" isEmpty={isEmpty} empty="No orders in this range.">
        {(data) => <Chart option={buildOption(data)} label={describe(data)} />}
      </PanelState>
    </Panel>
  )
}
