import { useApi } from '../lib/useApi'
import type { NameValue } from '../lib/types'
import { Panel } from './Panel'
import { PanelState } from './PanelState'
import { RankedBars } from './RankedBars'

export function ProductPanel() {
  const query = useApi<NameValue[]>('product-mix')

  return (
    <Panel title="Accepted orders by product" right={<span className="eyebrow">orders</span>}>
      <PanelState query={query} what="orders by product" isEmpty={(d) => d.length === 0} empty="No accepted orders in this range.">
        {(data) => <RankedBars bars={data.map((d) => ({ name: d.name, value: d.value, label: String(d.value) }))} />}
      </PanelState>
    </Panel>
  )
}
