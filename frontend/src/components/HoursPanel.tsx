import { hours } from '../lib/format'
import type { NameValue } from '../lib/types'
import { useApi } from '../lib/useApi'
import { Panel } from './Panel'
import { PanelState } from './PanelState'
import { RankedBars } from './RankedBars'

export function HoursPanel() {
  const query = useApi<NameValue[]>('stage-hours')

  return (
    <Panel title="Where the hours go" right={<span className="eyebrow">avg h / order</span>}>
      <PanelState
        query={query}
        what="production hours"
        isEmpty={(d) => d.every((r) => r.value == null)}
        empty="No delivered orders in this range, so there are no production hours to compare."
      >
        {(data) => (
          <RankedBars
            bars={data
              .filter((d) => d.value != null)
              .sort((a, b) => b.value - a.value)
              .map((d) => ({ name: d.name, value: d.value, label: hours(d.value) }))}
          />
        )}
      </PanelState>
    </Panel>
  )
}
