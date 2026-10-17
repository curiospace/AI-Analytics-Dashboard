import { days, percent, usd } from '../lib/format'
import { useFilters } from '../lib/filters'
import type { Kpis } from '../lib/types'
import { useApi } from '../lib/useApi'
import { KpiCard } from './KpiCard'
import { Panel } from './Panel'
import { PanelState } from './PanelState'

export function KpiStrip() {
  const query = useApi<Kpis>('kpis')
  const { product } = useFilters()

  const strip = (
    <PanelState query={query} what="the key figures">
      {(data) => {
        const delivered = data.delivered > 0
        return (
          <section aria-label="Key figures" className="grid grid-cols-2 gap-3 @2xl:grid-cols-3 @2xl:gap-4 @5xl:grid-cols-6">
            <KpiCard label="Revenue" value={usd(data.revenue)} sub={product ? 'All products (ledger has no product split)' : 'Cash, after late penalties'} />
            <KpiCard
              label="On-time delivery"
              value={percent(data.on_time_pct)}
              sub={delivered ? `${data.delivered - data.late_orders} of ${data.delivered} delivered` : 'No deliveries in this range'}
              tone={delivered ? 'accent' : 'default'}
            />
            <KpiCard label="Late orders" value={String(data.late_orders)} sub="1–7 days over, 10% penalty" tone={data.late_orders > 0 ? 'alert' : 'default'} />
            <KpiCard label="Quote win rate" value={percent(data.win_rate)} sub="Of all quotes" />
            <KpiCard label="Avg order value" value={usd(data.avg_order_value)} sub={delivered ? 'Delivered, net of penalty' : 'No deliveries in this range'} />
            <KpiCard label="Avg lead time" value={days(data.lead_days)} sub={delivered ? 'Order to delivery' : 'No deliveries in this range'} />
          </section>
        )
      }}
    </PanelState>
  )
  // until there are numbers, the loading or error message sits in a panel like every other one
  return query.data === undefined ? <Panel>{strip}</Panel> : strip
}
