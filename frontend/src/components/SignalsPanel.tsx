import { useFilters } from '../lib/filters'
import { bottleneck, margin, onTimeDip, profitGap, type Signal } from '../lib/signals'
import type { NameValue, OnTimeRow, ProfitRow, RevenueRow } from '../lib/types'
import { useApi } from '../lib/useApi'

// Tailwind needs full class names, so the tone lookup spells them out
const toneClass = { accent: 'text-accent-light', alert: 'text-alert-light' }

export function SignalsPanel() {
  const { product } = useFilters()
  // same API calls as the charts, so React Query shares the results: no extra requests
  const stages = useApi<NameValue[]>('stage-hours')
  const onTime = useApi<OnTimeRow[]>('ontime-vs-resignations')
  const profit = useApi<ProfitRow[]>('profit-by-product')
  const money = useApi<RevenueRow[]>('revenue-cost')

  const loading = stages.isPending || onTime.isPending || profit.isPending || money.isPending
  const updating = [stages, onTime, profit, money].some((q) => q.isPlaceholderData)
  // a failed load is not the same as "nothing to report"
  const failed = [stages, onTime, profit, money].some((q) => q.error && q.data === undefined)
  const signals = [
    stages.data && bottleneck(stages.data),
    onTime.data && onTimeDip(onTime.data),
    profit.data && profitGap(profit.data),
    money.data && margin(money.data, Boolean(product)),
  ].filter((s): s is Signal => Boolean(s))

  return (
    <section className="rounded-panel bg-ink p-5 text-snow">
      <h2 className="mb-4 text-base font-bold">Signals</h2>
      {loading && <p className="text-snow/70">Looking for patterns…</p>}
      {!loading && signals.length === 0 && (
        <p className="text-snow/70">
          {failed ? "Signals are unavailable because the data didn't load. They will appear once it does." : 'Nothing notable for this selection.'}
        </p>
      )}
      <div className={`grid grid-cols-1 gap-x-6 gap-y-4 transition-opacity duration-200 @2xl:grid-cols-2 @6xl:grid-cols-4 ${updating ? 'opacity-50' : ''}`} aria-busy={updating}>
        {signals.map((s) => (
          <div key={s.tag} className="flex flex-col gap-1.5 border-t border-night-line pt-3.5">
            <div className={`eyebrow ${toneClass[s.tone]}`}>{s.tag}</div>
            <p className="text-sm leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
