import { useApi } from '../lib/useApi'
import type { ProfitRow } from '../lib/types'
import { Panel } from './Panel'
import { PanelState } from './PanelState'
import { RankedBars } from './RankedBars'

export function ProfitPanel() {
  const query = useApi<ProfitRow[]>('profit-by-product')

  return (
    <Panel title="Profit per order" right={<span className="eyebrow">USD</span>}>
      <PanelState
        query={query}
        what="profit by product"
        isEmpty={(d) => d.length === 0}
        empty="No delivered orders in this range, so profit can't be estimated."
      >
        {(data) => (
          <RankedBars
            highlightLast
            bars={data.map((d) => ({
              name: d.name,
              value: d.avg_profit,
              label: `$${Math.round(d.avg_profit).toLocaleString('en-US')}`,
            }))}
          />
        )}
      </PanelState>
    </Panel>
  )
}
