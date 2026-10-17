import { lineOption, memoByData } from '../lib/chartOptions'
import { plural, usd, usdAxis } from '../lib/format'
import { colors } from '../lib/theme'
import type { RevenueRow } from '../lib/types'
import { useFilters } from '../lib/filters'
import { useApi } from '../lib/useApi'
import { Chart } from './Chart'
import { Legend } from './Legend'
import { Panel } from './Panel'
import { PanelState } from './PanelState'

const buildOption = memoByData((rows: RevenueRow[]) =>
  lineOption({
    months: rows.map((r) => r.month),
    maxLabels: 4,
    gridLeft: 44,
    yFormatter: usdAxis,
    valueFormatter: (v) => usd(Number(v)),
    series: [
      { name: 'Revenue', data: rows.map((r) => r.revenue), color: colors.accent },
      { name: 'Cost', data: rows.map((r) => r.cost), color: colors.series, dashed: true },
    ],
  }),
)

export function RevenueCostPanel() {
  const query = useApi<RevenueRow[]>('revenue-cost')
  const isEmpty = (d: RevenueRow[]) => d.length === 0
  const drawn = query.data !== undefined && !isEmpty(query.data)
  const { product } = useFilters()

  return (
    <Panel
      title="Revenue vs cost"
      right={drawn && <Legend items={[{ label: 'Revenue', color: colors.accent }, { label: 'Cost', color: colors.series, dashed: true }]} />}
    >
      <PanelState query={query} what="revenue and cost" isEmpty={isEmpty} empty="No ledger entries in this range.">
        {(data) => {
          const totalRevenue = data.reduce((sum, r) => sum + r.revenue, 0)
          const totalCost = data.reduce((sum, r) => sum + r.cost, 0)
          return (
            <>
              <Chart
                option={buildOption(data)}
                label={`Monthly revenue and cost over ${plural(data.length, 'month')}: ${usd(totalRevenue)} revenue against ${usd(totalCost)} cost.`}
              />
              {product && <p className="text-sm text-muted">Shown for all products: the ledger has no product split.</p>}
            </>
          )
        }}
      </PanelState>
    </Panel>
  )
}
